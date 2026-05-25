export default function CocNotesPanel({ privateNotes, onPrivateNotesChange }) {
  return (
    <section className="sheetSection">
      <h3>Notatki</h3>
      <label className="sheetField">
        <span>Notatki prywatne</span>
        <textarea rows="8" value={privateNotes} onChange={(e) => onPrivateNotesChange(e.target.value)} />
      </label>
    </section>
  );
}
