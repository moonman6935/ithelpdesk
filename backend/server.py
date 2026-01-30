from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configuration
SECRET_KEY = os.environ.get("SECRET_KEY", "b4f2c8d9e1a3c5b7a9d0e2f4a6b8c0d2")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 hours

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# pwd_context initialization removed due to bcrypt bug in passlib on Python 3.14

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# --- Models ---
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    password_hash: str
    role: str # "system_admin" or "admin"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "admin"

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

class InventoryItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    personnel_id: str
    personnel_name: str
    item_name: str
    serial_number: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "assigned" # "assigned", "returned"
    return_note: Optional[str] = None
    returned_at: Optional[datetime] = None

class InventoryCreate(BaseModel):
    personnel_id: str
    personnel_name: str
    item_name: str
    serial_number: str

class Confirmation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    personnel_id: str
    personnel_name: str
    items: List[dict]
    confirmed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "confirmed"

import bcrypt

# --- Auth Helpers ---
def get_password_hash(password: str):
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str):
    password_byte_enc = plain_password.encode('utf-8')
    hashed_password_byte_enc = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_byte_enc, hashed_password_byte_enc)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"username": username})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# --- Startup ---
@app.on_event("startup")
async def startup_event():
    # Create default system admin if not exists
    admin_count = await db.users.count_documents({"role": "system_admin"})
    if admin_count == 0:
        default_admin = {
            "id": str(uuid.uuid4()),
            "username": "admin",
            "password_hash": get_password_hash("admin123"),
            "role": "system_admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(default_admin)
        print("Default system admin created: admin / admin123")

# --- Routes ---
@api_router.post("/auth/login")
async def login(data: dict):
    username = data.get("username")
    password = data.get("password")
    user = await db.users.find_one({"username": username})
    if not user or not verify_password(password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Hatalı kullanıcı adı veya şifre")
    
    access_token = create_access_token(data={"sub": user["username"]})
    return {"access_token": access_token, "token_type": "bearer", "role": user["role"]}

@api_router.get("/inventory/{personnel_id}")
async def get_personnel_inventory(personnel_id: str):
    items = await db.inventory.find({"personnel_id": personnel_id, "status": "assigned"}, {"_id": 0}).to_list(1000)
    
    confirmation = await db.confirmations.find_one(
        {"personnel_id": personnel_id}, 
        sort=[("confirmed_at", -1)]
    )
    
    is_confirmed = False
    if confirmation and confirmation.get('status') == 'confirmed':
        is_confirmed = True
        
    return {
        "items": items,
        "is_confirmed": is_confirmed
    }

@api_router.post("/inventory/confirm")
async def confirm_inventory(confirmation: dict):
    confirmation['confirmed_at'] = datetime.now(timezone.utc).isoformat()
    confirmation['id'] = str(uuid.uuid4())
    confirmation['status'] = 'confirmed'
    await db.confirmations.insert_one(confirmation)
    return {"status": "success", "id": confirmation['id']}

# --- Admin Routes ---
@api_router.get("/admin/stats")
async def get_dashboard_stats():
    total_assigned = await db.inventory.count_documents({"status": "assigned"})
    total_returned = await db.inventory.count_documents({"status": "returned"})
    personnel_ids = await db.inventory.distinct("personnel_id")
    pending_confirmations = 0
    for p_id in personnel_ids:
        # If active items exist but no confirmation
        items = await db.inventory.count_documents({"personnel_id": p_id, "status": "assigned"})
        if items > 0:
            confirmed = await db.confirmations.find_one({"personnel_id": p_id, "status": "confirmed"})
            if not confirmed:
                pending_confirmations += 1
                
    return {
        "total_assigned_items": total_assigned,
        "total_returned_items": total_returned,
        "total_personnel_with_assets": len(personnel_ids),
        "pending_confirmations": pending_confirmations
    }

@api_router.post("/admin/inventory/bulk")
async def add_inventory_items_bulk(inputs: List[InventoryCreate]):
    items_to_insert = []
    p_id = inputs[0].personnel_id if inputs else None
    for input_data in inputs:
        item_obj = InventoryItem(**input_data.model_dump())
        doc = item_obj.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        items_to_insert.append(doc)
    
    if items_to_insert:
        await db.inventory.insert_many(items_to_insert)
        # Auto reset confirmation
        if p_id:
            await db.confirmations.update_many(
                {"personnel_id": p_id, "status": "confirmed"},
                {"$set": {"status": "reset", "reset_at": datetime.now(timezone.utc).isoformat()}}
            )
    return {"status": "success", "count": len(items_to_insert)}

@api_router.post("/admin/inventory/return")
async def return_inventory_item(item_id: str, note: str = ""):
    result = await db.inventory.update_one(
        {"id": item_id},
        {"$set": {
            "status": "returned", 
            "return_note": note, 
            "returned_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")
    return {"status": "success"}

@api_router.post("/admin/inventory/reset-confirmation")
async def reset_personnel_confirmation(personnel_id: str):
    await db.confirmations.update_many(
        {"personnel_id": personnel_id, "status": "confirmed"},
        {"$set": {"status": "reset", "reset_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"status": "success"}

@api_router.get("/admin/next-personnel-id")
async def get_next_personnel_id():
    # Find all distinct personnel IDs
    p_ids = await db.inventory.distinct("personnel_id")
    
    numeric_ids = []
    for pid in p_ids:
        try:
            numeric_ids.append(int(pid))
        except (ValueError, TypeError):
            continue
            
    if not numeric_ids:
        return {"next_id": "100001"}
    
    return {"next_id": str(max(numeric_ids) + 1)}

@api_router.get("/admin/personnel/search")
async def search_personnel_by_name(name: str):
    # Case-insensitive search for the exact name to find their ID
    personnel = await db.inventory.find_one(
        {"personnel_name": {"$regex": f"^{name}$", "$options": "i"}},
        {"personnel_id": 1, "_id": 0}
    )
    if personnel:
        return {"personnel_id": personnel["personnel_id"]}
    return {"personnel_id": None}

@api_router.get("/admin/random-personnel-id")
async def get_random_personnel_id():
    import random
    # Try multiple times to find a unique ID
    for _ in range(10):
        new_id = str(random.randint(100000, 999999))
        existing = await db.inventory.find_one({"personnel_id": new_id})
        if not existing:
            return {"random_id": new_id}
            
    # Fallback to current next_id logic if we keep hitting collisions (unlikely but safe)
    fallback = await get_next_personnel_id()
    return {"random_id": fallback["next_id"]}

@api_router.get("/admin/confirmations")
async def get_all_confirmations():
    return await db.confirmations.find({}, {"_id": 0}).to_list(1000)

@api_router.get("/admin/inventory")
async def get_all_inventory():
    return await db.inventory.find({}, {"_id": 0}).to_list(1000)

@api_router.get("/admin/users")
async def get_admins():
    return await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(100)

@api_router.post("/admin/users")
async def create_admin(data: UserCreate):
    existing = await db.users.find_one({"username": data.username})
    if existing:
        raise HTTPException(status_code=400, detail="Bu kullanıcı adı zaten mevcut")
    
    new_user = {
        "id": str(uuid.uuid4()),
        "username": data.username,
        "password_hash": get_password_hash(data.password),
        "role": data.role,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(new_user)
    return {"status": "success"}

@api_router.delete("/admin/users/{username}")
async def delete_admin(username: str):
    if username == "admin":
        raise HTTPException(status_code=400, detail="Ana sistem yöneticisi silinemez")
    await db.users.delete_one({"username": username})
    return {"status": "success"}

@api_router.get("/")
async def root():
    return {"message": "DCS IT IT Assets API"}

# Include and Setup Middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
