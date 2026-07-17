import * as XLSX from 'xlsx';

export function buildPendingGroups(inventory, confirmations) {
    const confirmedIds = new Set(
        confirmations
            .filter((c) => c.status === 'confirmed')
            .map((c) => String(c.personnel_id))
    );

    const map = new Map();

    inventory.forEach((item) => {
        if (item.status !== 'assigned') return;

        const pid = String(item.personnel_id);
        if (confirmedIds.has(pid)) return;

        if (!map.has(pid)) {
            map.set(pid, {
                personnel_id: pid,
                personnel_name: item.personnel_name,
                items: [],
                latest_assigned_at: null,
            });
        }

        const group = map.get(pid);
        group.items.push(item);

        const created = item.created_at ? new Date(item.created_at).getTime() : 0;
        if (!group.latest_assigned_at || created > group.latest_assigned_at) {
            group.latest_assigned_at = created;
        }
    });

    return [...map.values()].sort((a, b) =>
        String(a.personnel_name).localeCompare(String(b.personnel_name), 'tr')
    );
}

function formatDateTime(value) {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString('tr-TR');
}

function formatDate(value) {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('tr-TR');
}

export function exportPendingConfirmationsToExcel(pendingGroups, labels) {
    const detailRows = [];

    pendingGroups.forEach((person) => {
        person.items.forEach((item) => {
            detailRows.push({
                [labels.personnelId]: person.personnel_id,
                [labels.personnelName]: person.personnel_name,
                [labels.itemName]: item.item_name || '',
                [labels.serialNo]: item.serial_number || '',
                [labels.assignedAt]: formatDateTime(item.created_at),
                [labels.status]: labels.pendingStatus,
            });
        });
    });

    const summaryRows = pendingGroups.map((person) => ({
        [labels.personnelId]: person.personnel_id,
        [labels.personnelName]: person.personnel_name,
        [labels.activeItems]: person.items.length,
        [labels.pendingSince]: formatDate(person.latest_assigned_at),
        [labels.status]: labels.pendingStatus,
    }));

    // xlsx is already a project dependency (excel import/export elsewhere).
    const workbook = XLSX.utils.book_new();

    const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(workbook, summarySheet, labels.summarySheet);

    const detailSheet = XLSX.utils.json_to_sheet(detailRows);
    XLSX.utils.book_append_sheet(workbook, detailSheet, labels.detailSheet);

    const dateStamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `${labels.filePrefix}_${dateStamp}.xlsx`);
}
