import { useId, useRef, useState } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { vi } from 'date-fns/locale';

registerLocale('vi', vi);

const INPUT_CLASS =
  'input-field w-full px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-sm';

function DateTimeCalendarContainer({ className, children }) {
  return <div className={`${className} react-datepicker--stacked`}>{children}</div>;
}

export default function DateTimeField({
  value,
  onChange,
  minDate,
  disabled,
  placeholder = 'Chọn ngày & giờ',
  id: idProp,
}) {
  const autoId = useId();
  const id = idProp || autoId;
  const pickerRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(null);

  const closePicker = () => {
    pickerRef.current?.setOpen(false);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setDraft(value);
    closePicker();
  };

  const handleConfirm = () => {
    if (draft) onChange(draft);
    closePicker();
  };

  return (
    <DatePicker
      ref={pickerRef}
      id={id}
      selected={isOpen ? draft : value}
      onChange={(date) => setDraft(date)}
      onCalendarOpen={() => {
        setDraft(value);
        setIsOpen(true);
      }}
      onCalendarClose={() => setIsOpen(false)}
      onClickOutside={(e) => {
        e.preventDefault();
        handleCancel();
      }}
      showTimeInput
      timeInputLabel="Giờ"
      timeFormat="HH:mm"
      dateFormat="dd/MM/yyyy HH:mm"
      locale="vi"
      placeholderText={placeholder}
      disabled={disabled}
      minDate={minDate}
      withPortal
      portalId="facepass-datepicker-portal"
      shouldCloseOnSelect={false}
      className={INPUT_CLASS}
      calendarClassName="react-datepicker--compact"
      calendarContainer={DateTimeCalendarContainer}
    >
      <div className="datepicker-footer">
        <button
          type="button"
          className="btn-ghost px-3 py-1.5 text-sm"
          onClick={(e) => {
            e.preventDefault();
            handleCancel();
          }}
        >
          Hủy
        </button>
        <button
          type="button"
          className="btn-primary-soft px-3 py-1.5 text-sm"
          onClick={(e) => {
            e.preventDefault();
            handleConfirm();
          }}
          disabled={!draft}
        >
          Xác nhận
        </button>
      </div>
    </DatePicker>
  );
}
