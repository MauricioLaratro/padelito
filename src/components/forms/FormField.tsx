import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

interface BaseFieldProps {
  label: string;
}

interface TextInputFieldProps
  extends BaseFieldProps,
    InputHTMLAttributes<HTMLInputElement> {
  fieldType?: "input";
}

interface TextareaFieldProps
  extends BaseFieldProps,
    TextareaHTMLAttributes<HTMLTextAreaElement> {
  fieldType: "textarea";
}

interface SelectFieldProps
  extends BaseFieldProps,
    SelectHTMLAttributes<HTMLSelectElement> {
  children: ReactNode;
  fieldType: "select";
}

type FormFieldProps =
  | TextInputFieldProps
  | TextareaFieldProps
  | SelectFieldProps;

const controlClassName =
  "min-h-11 rounded-lg border border-border-subtle bg-surface-primary px-3 text-sm text-text-primary outline-none transition placeholder:text-text-secondary/70 focus:border-accent-lime";

/**
 * Campo de formulario reutilizable.
 * Se construye para evitar estilos repetidos en onboarding y publicaciones.
 * Lo usan formularios del MVP.
 * Sirve para mantener controles legibles en mobile.
 */
export function FormField(props: FormFieldProps) {
  if (props.fieldType === "textarea") {
    const {
      fieldType: textareaFieldType,
      label: fieldLabel,
      ...textareaProps
    } = props;
    void textareaFieldType;

    return (
      <label className="grid gap-1.5 text-xs font-bold text-text-secondary">
        {fieldLabel}
        <textarea
          className={`${controlClassName} min-h-20 resize-y py-3`}
          {...textareaProps}
        />
      </label>
    );
  }

  if (props.fieldType === "select") {
    const {
      children,
      fieldType: selectFieldType,
      label: fieldLabel,
      ...selectProps
    } = props;
    void selectFieldType;

    return (
      <label className="grid gap-1.5 text-xs font-bold text-text-secondary">
        {fieldLabel}
        <select className={controlClassName} {...selectProps}>
          {children}
        </select>
      </label>
    );
  }

  const {
    fieldType: inputFieldType,
    label: fieldLabel,
    ...inputProps
  } = props;
  void inputFieldType;

  return (
    <label className="grid gap-1.5 text-xs font-bold text-text-secondary">
      {fieldLabel}
      <input className={controlClassName} {...inputProps} />
    </label>
  );
}
