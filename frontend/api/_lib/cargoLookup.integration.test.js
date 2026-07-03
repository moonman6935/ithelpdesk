const {
    namesMatch,
    personMatchesCargo,
    isTrackableShipmentDirection,
} = require('./cargoMatch');

function simulateLookup(allCargo, personnelId, personnelName, inventoryName) {
    const person = { personnel_id: personnelId, personnel_name: inventoryName };
    const matched = allCargo.filter((cargo) => personMatchesCargo(cargo, person, personnelName));

    let shipmentRecords = matched.filter((cargo) => isTrackableShipmentDirection(cargo.direction));
    if (!shipmentRecords.length) {
        shipmentRecords = matched.filter((cargo) => cargo.direction === 'incoming');
    }

    return shipmentRecords;
}

const muharremCargo = [
    {
        id: '1',
        direction: 'outgoing',
        personnel_name: 'MUHARREM KONYALI',
        recipient: 'Muharrem Konyali',
        serial_number: 'YK123',
        item_name: 'Laptop',
    },
    {
        id: '2',
        direction: 'incoming',
        personnel_name: 'MUHARREM KONYALI',
        serial_number: 'YK124',
        item_name: 'Monitor',
    },
    {
        id: '3',
        direction: undefined,
        personnel_name: 'D.C.S.TURIZM TICARET',
        recipient: 'Muharrem Konyalı',
        serial_number: 'YK125',
        item_name: 'Kargo',
    },
];

const results = simulateLookup(muharremCargo, '100002', 'Muharrem Konyalı', 'Muharrem Konyali');
if (results.length < 2) {
    throw new Error(`Expected at least 2 shipments for Muharrem, got ${results.length}`);
}

const onlyIncoming = [
    {
        id: '9',
        direction: 'incoming',
        personnel_name: 'MUHARREM KONYALI',
        serial_number: 'YK999',
        item_name: 'Tablet',
    },
];

const incomingFallback = simulateLookup(onlyIncoming, '100002', 'Muharrem Konyali', 'Muharrem Konyali');
if (incomingFallback.length !== 1) {
    throw new Error('Incoming fallback should return incoming cargo when no outgoing exists');
}

console.log('Integration simulation passed:', results.length, 'shipments for Muharrem');
