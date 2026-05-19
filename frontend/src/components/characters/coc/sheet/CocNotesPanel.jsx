export default function CocNotesPanel({ privateNotes, onPrivateNotesChange }) {
  return (
    <section className="sheetSection">
      <h3>Notes</h3>
      <label className="sheetField">
        <span>Private Notes</span>
        <textarea rows="8" value={privateNotes} onChange={(e) => onPrivateNotesChange(e.target.value)} />
      </label>
    </section>
  );
}
