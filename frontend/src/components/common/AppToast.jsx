import { useEffect } from "react";

export default function AppToast({ message, type = "error", onClose }) {
  useEffect(() => {
    if (!message) return undefined;

    function closeOnInteraction() {
      onClose?.();
    }

    const attachTimer = window.setTimeout(() => {
      window.addEventListener("pointerdown", closeOnInteraction);
      window.addEventListener("keydown", closeOnInteraction);
    }, 100);

    return () => {
      window.clearTimeout(attachTimer);
      window.removeEventListener("pointerdown", closeOnInteraction);
      window.removeEventListener("keydown", closeOnInteraction);
    };
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div
      className={`appToast appToast--${type}`}
      role={type === "error" ? "alert" : "status"}
      onPointerDown={(event) => {
        event.stopPropagation();
        onClose?.();
      }}
    >
      {message}
    </div>
  );
}
