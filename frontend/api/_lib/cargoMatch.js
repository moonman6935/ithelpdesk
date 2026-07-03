function normalizeCargoKey(value) {
    return String(value ?? '')
        .toLocaleLowerCase('tr-TR')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .replace(/ı/g, 'i')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function tokenizeName(value) {
    return normalizeCargoKey(value)
        .split(/\s+/)
        .filter((word) => word.length >= 2);
}

function namesMatch(inputName, storedName) {
    const inputKey = normalizeCargoKey(inputName);
    const storedKey = normalizeCargoKey(storedName);
    if (!inputKey || !storedKey) return false;
    if (inputKey === storedKey) return true;
    if (inputKey.includes(storedKey) || storedKey.includes(inputKey)) return true;

    const inputWords = tokenizeName(inputName);
    const storedWords = tokenizeName(storedName);
    if (!inputWords.length || !storedWords.length) return false;

    const inputInStored = inputWords.every((word) => storedKey.includes(word));
    const storedInInput = storedWords.every((word) => inputKey.includes(word));
    return inputInStored || storedInInput;
}

function personMatchesCargo(cargo, person, queryName = '') {
    if (!cargo) return false;

    const personnelId = String(person?.personnel_id ?? '').trim();
    if (personnelId && String(cargo.personnel_id ?? '').trim() === personnelId) {
        return true;
    }

    const nameCandidates = [person?.personnel_name, queryName]
        .map((name) => String(name ?? '').trim())
        .filter(Boolean);

    const cargoNames = [cargo.personnel_name, cargo.recipient]
        .map((name) => String(name ?? '').trim())
        .filter(Boolean);

    return nameCandidates.some((candidate) =>
        cargoNames.some((cargoName) => namesMatch(candidate, cargoName))
    );
}

function isTrackableShipmentDirection(direction) {
    const value = String(direction ?? '').trim().toLowerCase();
    return value !== 'incoming';
}

module.exports = {
    normalizeCargoKey,
    namesMatch,
    personMatchesCargo,
    isTrackableShipmentDirection,
};
