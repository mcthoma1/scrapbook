import React, { createContext, useContext, useState, useRef, useEffect } from "react";

const DropdownContext = createContext();

export function DropdownMenu({ children }) {
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);
  const toggle = () => setOpen((o) => !o);

  return (
    <DropdownContext.Provider value={{ open, close, toggle }}>
      <div className="relative inline-block text-left">{children}</div>
    </DropdownContext.Provider>
  );
}

export function DropdownMenuTrigger({ children, asChild }) {
  const { toggle } = useContext(DropdownContext);

  const handleClick = (e) => {
    toggle();
    if (children.props && typeof children.props.onClick === "function") {
      children.props.onClick(e);
    }
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, { onClick: handleClick });
  }

  return (
    <button type="button" onClick={handleClick}>
      {children}
    </button>
  );
}

export function DropdownMenuContent({ children, align = "start", className = "" }) {
  const { open, close } = useContext(DropdownContext);
  const contentRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e) => {
      if (contentRef.current && !contentRef.current.contains(e.target)) {
        close();
      }
    };

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        close();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, close]);

  if (!open) return null;

  const alignmentClass = align === "end" ? "right-0" : "left-0";

  return (
    <div
      ref={contentRef}
      className={`absolute ${alignmentClass} mt-2 min-w-[8rem] rounded-md bg-white shadow-lg border border-gray-100 z-50 ${
        className
      }`}
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({
  children,
  asChild,
  onClick,
  onSelect,
  className = "",
}) {
  const { close } = useContext(DropdownContext);

  const handleClick = (e) => {
    if (typeof onSelect === "function") onSelect(e);
    if (typeof onClick === "function") onClick(e);
    close();
  };

  if (asChild && React.isValidElement(children)) {
    const childProps = {
      onClick: (e) => {
        if (children.props && typeof children.props.onClick === "function") {
          children.props.onClick(e);
        }
        handleClick(e);
      },
      className: `${children.props?.className || ""} ${className}`.trim(),
    };
    return React.cloneElement(children, childProps);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${className}`}
    >
      {children}
    </button>
  );
}

export default DropdownMenu;
