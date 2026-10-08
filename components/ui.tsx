"use client";
import { useEffect, useRef, type ReactNode, type FormEvent } from "react";
import { X, Bird, Plus } from "lucide-react";
export function Brand({
  small = false,
  logo = "",
}: {
  small?: boolean;
  logo?: string;
}) {
  return (
    <div className={"brand " + (small ? "small" : "")}>
      {logo ? (
        <img src={logo} alt="Logo" className="brand-logo" />
      ) : (
        <span className="brand-symbol">
          <svg
            width={small ? 30 : 38}
            height={small ? 30 : 38}
            viewBox="0 0 40 40"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M6 24c0-9 8-14 15-13c1-6 10-8 13-2l4 4l-5 3c-1 11-9 18-20 16l-7 6l2-12"
              fill="currentColor"
            />
            <path
              d="M12 21c2 5 6 7 12 3"
              stroke="var(--paper)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="29" cy="10" r="1.5" fill="var(--paper)" />
            <path d="M17 32v5m7-6v6" stroke="currentColor" strokeWidth="2" />
          </svg>
        </span>
      )}
      <div>
        <strong>
          Bicou Brincou<span>®</span>
        </strong>
        <small>by Peck Fun</small>
      </div>
    </div>
  );
}
export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={"badge " + tone}>{children}</span>;
}
export function Empty({
  title = "Nada por aqui ainda",
  description = "Use o botão acima para fazer seu primeiro cadastro.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="empty">
      <Bird size={38} />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  actionLabel = "Novo cadastro",
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: () => void;
  actionLabel?: string;
}) {
  return (
    <div className="section-header">
      <div>
        <p className="eyebrow">{eyebrow || "SEU ATELIÊ, ORGANIZADO"}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action ? (
        <button className="btn primary" onClick={action}>
          <Plus size={18} />
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const d = ref.current;
    d?.showModal();
    const cancel = (e: Event) => {
      e.preventDefault();
      closeRef.current();
    };
    d?.addEventListener("cancel", cancel);
    return () => {
      d?.removeEventListener("cancel", cancel);
      d?.close();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-label={title}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="modal-inner">
        <header>
          <h2>{title}</h2>
          <button
            className="icon-btn"
            type="button"
            onClick={onClose}
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}
export type Values = Record<string, string | number | boolean>;
export interface Field {
  key: string;
  label: string;
  type?: "number" | "date" | "email" | "textarea" | "checkbox" | "select";
  options?: { value: string; label: string }[];
  required?: boolean;
  step?: string;
  min?: number;
  max?: number;
  disabled?: boolean;
  hint?: string;
}
export function Fields({
  fields,
  values,
  onChange,
}: {
  fields: Field[];
  values: Values;
  onChange: (values: Values) => void;
}) {
  return (
    <div className="form-grid">
      {fields.map((f) => (
        <label className={f.type === "textarea" ? "wide" : ""} key={f.key}>
          {f.label}
          {f.type === "checkbox" ? (
            <input
              aria-label={f.label}
              type="checkbox"
              checked={Boolean(values[f.key])}
              onChange={(e) =>
                onChange({ ...values, [f.key]: e.target.checked })
              }
            />
          ) : f.type === "select" ? (
            <select
              aria-label={f.label}
              value={String(values[f.key] ?? "")}
              onChange={(e) => onChange({ ...values, [f.key]: e.target.value })}
              required={f.required}
              disabled={f.disabled}
            >
              <option value="">Selecione</option>
              {f.options?.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : f.type === "textarea" ? (
            <textarea
              aria-label={f.label}
              value={String(values[f.key] ?? "")}
              onChange={(e) => onChange({ ...values, [f.key]: e.target.value })}
            />
          ) : (
            <input
              aria-label={f.label}
              type={f.type || "text"}
              value={String(values[f.key] ?? "")}
              onChange={(e) =>
                onChange({
                  ...values,
                  [f.key]:
                    f.type === "number"
                      ? e.target.value === ""
                        ? ""
                        : Number(e.target.value)
                      : e.target.value,
                })
              }
              min={f.min ?? (f.type === "number" ? 0 : undefined)}
              max={f.max}
              step={f.step || "any"}
              required={f.required}
              disabled={f.disabled}
            />
          )}{" "}
          {f.hint ? <small>{f.hint}</small> : null}
        </label>
      ))}
    </div>
  );
}
export function FormFooter({
  busy,
  onClose,
}: {
  busy: boolean;
  onClose: () => void;
}) {
  return (
    <footer className="form-footer">
      <button className="btn" type="button" onClick={onClose}>
        Cancelar
      </button>
      <button className="btn primary" type="submit" disabled={busy}>
        {busy ? "Salvando…" : "Salvar e confirmar"}
      </button>
    </footer>
  );
}
export function submit(handler: () => Promise<void>) {
  return async (e: FormEvent) => {
    e.preventDefault();
    try {
      await handler();
    } catch {
      /* Error shown by provider/form. */
    }
  };
}
