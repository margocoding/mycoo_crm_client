import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LuChevronDown, LuCheck } from 'react-icons/lu';

export interface SelectOption {
  value: string;
  label: string;
  color?: string;
  disabled?: boolean;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
}

interface DropdownPosition {
  top: number;
  left: number;
  width: number;
  placement: 'top' | 'bottom';
}

export default function Select({
  options,
  value,
  onChange,
  className = '',
  disabled = false,
  ariaLabel,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] =
    useState<DropdownPosition | null>(null);

  const selectRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOption = options.find(
    (option) => option.value === value,
  );

  const updatePosition = () => {
    if (!buttonRef.current) return;

    const rect =
      buttonRef.current.getBoundingClientRect();

    const gap = 6;
    const viewportPadding = 8;
    const dropdownHeight =
      dropdownRef.current?.offsetHeight ?? 180;

    const dropdownWidth = Math.max(
      rect.width,
      150,
    );

    const spaceBelow =
      window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    const shouldOpenUp =
      spaceBelow < dropdownHeight + gap &&
      spaceAbove > spaceBelow;

    let top = shouldOpenUp
      ? rect.top - dropdownHeight - gap
      : rect.bottom + gap;

    top = Math.max(
      viewportPadding,
      Math.min(
        top,
        window.innerHeight -
          dropdownHeight -
          viewportPadding,
      ),
    );

    let left = rect.left;

    if (
      left + dropdownWidth >
      window.innerWidth - viewportPadding
    ) {
      left =
        window.innerWidth -
        dropdownWidth -
        viewportPadding;
    }

    left = Math.max(viewportPadding, left);

    setPosition({
      top,
      left,
      width: dropdownWidth,
      placement: shouldOpenUp
        ? 'top'
        : 'bottom',
    });
  };

  const toggleOpen = () => {
    if (disabled) return;

    if (!isOpen) {
      setPosition(null);

      requestAnimationFrame(() => {
        updatePosition();
      });
    }

    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => {
      updatePosition();
    };

    const handleScroll = () => {
      updatePosition();
    };

    requestAnimationFrame(() => {
      updatePosition();
    });

    window.addEventListener(
      'resize',
      handleResize,
    );

    window.addEventListener(
      'scroll',
      handleScroll,
      true,
    );

    return () => {
      window.removeEventListener(
        'resize',
        handleResize,
      );

      window.removeEventListener(
        'scroll',
        handleScroll,
        true,
      );
    };
  }, [isOpen, options.length]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (
      event: MouseEvent,
    ) => {
      const target = event.target as Node;

      const clickedTrigger =
        selectRef.current?.contains(target);

      const clickedDropdown =
        dropdownRef.current?.contains(target);

      if (
        !clickedTrigger &&
        !clickedDropdown
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener(
      'mousedown',
      handleClickOutside,
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside,
      );
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener(
      'keydown',
      handleKeyDown,
    );

    return () => {
      document.removeEventListener(
        'keydown',
        handleKeyDown,
      );
    };
  }, [isOpen]);

  const dropdown = (
    <div
      ref={dropdownRef}
      className={`
        fixed
        min-w-[150px]
        overflow-hidden
        rounded-lg
        border
        border-line/60
        glass
        py-1
        transition-all
        duration-150
        ${
          position?.placement === 'top'
            ? 'origin-bottom'
            : 'origin-top'
        }
        ${
          isOpen
            ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
            : position?.placement === 'top'
              ? 'pointer-events-none translate-y-1 scale-95 opacity-0'
              : 'pointer-events-none -translate-y-1 scale-95 opacity-0'
        }
      `}
      style={{
        top: position?.top ?? 0,
        left: position?.left ?? 0,
        width: position?.width ?? 150,
        zIndex: 2147483647,
      }}
    >
      {options.map((option) => {
        const isSelected =
          value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            disabled={
              disabled || option.disabled
            }
            onClick={() => {
              onChange(option.value);
              setIsOpen(false);
            }}
            className={`
              flex
              w-full
              items-center
              gap-2
              px-3
              py-2
              text-left
              text-[11px]
              font-medium
              transition-all
              disabled:cursor-not-allowed
              disabled:opacity-40
              ${
                isSelected
                  ? 'bg-flux/10 text-snow'
                  : 'text-fog/70 hover:bg-hull/40 hover:text-mist'
              }
            `}
          >
            {option.color && (
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{
                  backgroundColor:
                    option.color,
                  boxShadow: `0 0 6px ${option.color}60`,
                }}
              />
            )}

            <span className="min-w-0 flex-1 truncate">
              {option.label}
            </span>

            {isSelected && (
              <LuCheck className="h-3.5 w-3.5 shrink-0 text-flux" />
            )}
          </button>
        );
      })}
    </div>
  );

  const portalRoot =
    document.getElementById('portal-root');

  return (
    <>
      <div
        ref={selectRef}
        className={`relative w-full ${className}`}
      >
        <button
          ref={buttonRef}
          type="button"
          disabled={disabled}
          aria-label={ariaLabel}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          onClick={toggleOpen}
          className={`
            flex
            min-h-[44px]
            w-full
            items-center
            gap-2.5
            rounded-md
            border
            px-3.5
            py-3
            text-left
            text-[12.5px]
            font-medium
            transition-all
            duration-200
            cursor-pointer
            disabled:cursor-not-allowed
            disabled:opacity-60
            ${
              isOpen
                ? 'border-flux/40 bg-flux/5 text-snow shadow-[0_0_16px_-6px_rgba(56,189,248,0.45)]'
                : 'border-line bg-void/50 text-fog/70 hover:border-line/80 hover:text-mist'
            }
          `}
        >
          {currentOption?.color && (
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{
                backgroundColor:
                  currentOption.color,
                boxShadow: `0 0 6px ${currentOption.color}80`,
              }}
            />
          )}

          <span className="min-w-0 flex-1 truncate">
            {currentOption?.label}
          </span>

          <LuChevronDown
            className={`
              h-4
              w-4
              shrink-0
              text-fog/45
              transition-transform
              duration-200
              ${
                isOpen
                  ? 'rotate-180 text-flux'
                  : ''
              }
            `}
          />
        </button>
      </div>

      {isOpen &&
        position &&
        portalRoot &&
        createPortal(
          dropdown,
          portalRoot,
        )}
    </>
  );
}