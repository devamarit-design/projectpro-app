/**
 * One-off: move UNPAID contracts (no installment marked "Paid") to trash (soft delete).
 * Contracts with any paid installment — and all Expenses — are left untouched.
 *
 * Usage (needs Google credentials: `gcloud auth application-default login`):
 *   node scripts/trash-unpaid-contracts.js          # dry run, lists what would change
 *   node scripts/trash-unpaid-contracts.js --apply  # actually soft-delete
 */
const { initializeApp, applicationDefault } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')

const APPLY = process.argv.includes('--apply')
initializeApp({ credential: applicationDefault(), projectId: 'projectpro-app-76535' })
const db = getFirestore()

async function main() {
    const snap = await db.collection('contracts').get()
    const targets = []
    let kept = 0
    snap.forEach(d => {
        const c = d.data()
        if (c.isDeleted === true) return
        const installments = Array.isArray(c.installments) ? c.installments : []
        const hasPaid = installments.some(i => i.status === 'Paid' || i.expenseId)
        if (hasPaid) { kept++; return }
        targets.push({ id: d.id, title: c.title, doc: c.documentNumber, total: c.totalAmount, orgId: c.orgId })
    })

    console.log(`Kept (has paid installment): ${kept}`)
    console.log(`Unpaid -> trash: ${targets.length}`)
    targets.forEach(t => console.log(` - ${t.doc || t.id} | ${t.title} | ${t.total} | org ${t.orgId}`))

    if (!APPLY) { console.log('\nDry run only. Re-run with --apply to soft-delete.'); return }

    const now = new Date().toISOString()
    for (let i = 0; i < targets.length; i += 400) {
        const batch = db.batch()
        targets.slice(i, i + 400).forEach(t => batch.update(db.collection('contracts').doc(t.id), { isDeleted: true, deletedAt: now }))
        await batch.commit()
    }
    console.log(`\nDone. Moved ${targets.length} contracts to trash.`)
}

main().catch(e => { console.error(e); process.exit(1) })
