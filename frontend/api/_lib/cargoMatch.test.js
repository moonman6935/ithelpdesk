const {
    normalizeCargoKey,
    namesMatch,
    personMatchesCargo,
    isTrackableShipmentDirection,
} = require('./cargoMatch');

const assert = (label, condition) => {
    if (!condition) {
        throw new Error(`FAIL: ${label}`);
    }
    console.log(`OK: ${label}`);
};

assert('basic match', namesMatch('Muharrem Konyali', 'MUHARREM KONYALI'));
assert('turkish i', namesMatch('Muharrem Konyalı', 'Muharrem Konyali'));
assert('reversed order', namesMatch('Muharrem Konyalı', 'KONYALİ MUHARREM'));
assert('company prefix', namesMatch('Muharrem Konyali', 'D.C.S.TURİZM MUHARREM KONYALI'));
assert('extra spaces', namesMatch('Muharrem  Konyali', 'MUHARREM KONYALI'));
assert('recipient field', personMatchesCargo(
    { personnel_name: 'OTHER', recipient: 'Muharrem Konyalı', direction: 'outgoing' },
    { personnel_id: '100002', personnel_name: 'Muharrem Konyali' },
    'Muharrem Konyalı'
));
assert('incoming direction excluded from trackable', !isTrackableShipmentDirection('incoming'));
assert('missing direction is trackable', isTrackableShipmentDirection(undefined));
assert('normalize turkish', normalizeCargoKey('KONYALİ') === 'konyali');

const outgoingOnly = [
    { id: '1', direction: 'outgoing', personnel_name: 'MUHARREM KONYALI', serial_number: 'A1' },
    { id: '2', direction: 'incoming', personnel_name: 'MUHARREM KONYALI', serial_number: 'A2' },
    { id: '3', direction: undefined, personnel_name: 'MUHARREM KONYALI', serial_number: 'A3' },
].filter((cargo) =>
    personMatchesCargo(cargo, { personnel_id: '100002', personnel_name: 'Muharrem Konyali' }, 'Muharrem Konyalı')
);

assert('finds outgoing and legacy records', outgoingOnly.length === 3);

console.log('All cargo match tests passed.');
