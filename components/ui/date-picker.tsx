import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

type DatePickerProps = {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  placeholderText?: string;
  className?: string;
};

export const CustomDatePicker: React.FC<DatePickerProps> = ({
  selected,
  onChange,
  placeholderText,
  className,
}) => {
  return (
    <DatePicker
      selected={selected}
      onChange={onChange}
      placeholderText={placeholderText}
      className={className}
      dateFormat="yyyy-MM-dd"
    />
  );
};

export default CustomDatePicker;