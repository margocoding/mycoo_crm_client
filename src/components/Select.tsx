import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LuChevronDown, LuCheck } from 'react-icons/lu';

export interface SelectOption {
  value: string;
  label: string;
  color?: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
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
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<DropdownPosition | null>(null);

  const selectRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOption = options.find(
    (option) => option.value === value
  );

  /**
   * Calculate dropdown position relative to viewport.
   */
  const updatePosition = () => {
    if (!buttonRef.current) {
      return;
    }

    const rect = buttonRef.current.getBoundingClientRect();

    const gap = 6;
    const viewportPadding = 8;

    /**
     * We don't always know the dropdown height before
     * it has been rendered, so use the actual height
     * when available and a reasonable fallback otherwise.
     */
    const dropdownHeight =
      dropdownRef.current?.offsetHeight ?? 180;

    const dropdownWidth = Math.max(
      rect.width,
      150
    );

    const spaceBelow =
      window.innerHeight - rect.bottom;

    const spaceAbove = rect.top;

    const shouldOpenUp =
      spaceBelow < dropdownHeight + gap &&
      spaceAbove > spaceBelow;

    let top: number;

    if (shouldOpenUp) {
      top = rect.top - dropdownHeight - gap;
    } else {
      top = rect.bottom + gap;
    }

    /**
     * Keep dropdown inside viewport vertically.
     */
    top = Math.max(
      viewportPadding,
      Math.min(
        top,
        window.innerHeight -
          dropdownHeight -
          viewportPadding
      )
    );

    let left = rect.left;

    /**
     * Prevent dropdown from going outside
     * the right side of the viewport.
     */
    if (
      left + dropdownWidth >
      window.innerWidth - viewportPadding
    ) {
      left =
        window.innerWidth -
        dropdownWidth -
        viewportPadding;
    }

    /**
     * Prevent dropdown from going outside
     * the left side of the viewport.
     */
    left = Math.max(
      viewportPadding,
      left
    );

    setPosition({
      top,
      left,
      width: dropdownWidth,
      placement: shouldOpenUp
        ? 'top'
        : 'bottom',
    });
  };

  /**
   * Open / close dropdown.
   */
  const toggleOpen = () => {
    if (!isOpen) {
      setPosition(null);

      requestAnimationFrame(() => {
        updatePosition();
      });
    }

    setIsOpen((prev) => !prev);
  };

  /**
   * Recalculate position while dropdown is open.
   */
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleResize = () => {
      updatePosition();
    };

    const handleScroll = () => {
      updatePosition();
    };

    /**
     * Initial calculation.
     */
    requestAnimationFrame(() => {
      updatePosition();
    });

    window.addEventListener(
      'resize',
      handleResize
    );

    /**
     * true = capture scroll events from
     * nested scroll containers too.
     */
    window.addEventListener(
      'scroll',
      handleScroll,
      true
    );

    return () => {
      window.removeEventListener(
        'resize',
        handleResize
      );

      window.removeEventListener(
        'scroll',
        handleScroll,
        true
      );
    };
  }, [isOpen, options.length]);

  /**
   * Close on outside click.
   *
   * Dropdown is rendered through a Portal,
   * therefore we have to check both:
   *
   * - Select trigger
   * - Dropdown itself
   */
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (
      event: MouseEvent
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
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );
    };
  }, [isOpen]);

  /**
   * Close when Escape is pressed.
   */
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener(
      'keydown',
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        'keydown',
        handleKeyDown
      );
    };
  }, [isOpen]);

  /**
   * Dropdown element.
   */
  const dropdown = (
    <div
      ref={dropdownRef}
      className={`
        fixed
        min-w-[150px]
        glass
        rounded-lg
        border
        border-line/60
        py-1
        overflow-hidden
        transition-all
        duration-150
        ${
          position?.placement === 'top'
            ? 'origin-bottom'
            : 'origin-top'
        }
        ${
          isOpen
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : position?.placement === 'top'
              ? 'opacity-0 scale-95 translate-y-1 pointer-events-none'
              : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'
        }
      `}
      style={{
        top: position?.top ?? 0,
        left: position?.left ?? 0,
        width: position?.width ?? 150,

        /**
         * Maximum possible z-index.
         */
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
            onClick={() => {
              onChange(option.value);
              setIsOpen(false);
            }}
            className={`
              w-full
              flex
              items-center
              gap-2
              px-3
              py-2
              text-[10px]
              font-medium
              transition-all
              cursor-pointer
              ${
                isSelected
                  ? 'bg-flux/10 text-snow'
                  : 'text-fog/70 hover:text-mist hover:bg-hull/40'
              }
            `}
          >
            {option.color && (
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{
                  backgroundColor:
                    option.color,
                  boxShadow: `0 0 6px ${option.color}60`,
                }}
              />
            )}

            <span className="truncate">
              {option.label}
            </span>

            {isSelected && (
              <LuCheck className="w-3 h-3 ml-auto shrink-0 text-flux" />
            )}
          </button>
        );
      })}
    </div>
  );

  /**
   * Portal root.
   */
  const portalRoot =
    document.getElementById(
      'portal-root'
    );

  return (
    <>
      <div
        ref={selectRef}
        className={`relative ${className}`}
      >
        <button
          ref={buttonRef}
          type="button"
          onClick={toggleOpen}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className={`
            flex
            items-center
            gap-1.5
            rounded-md
            px-2
            py-1
            text-[10px]
            font-medium
            transition-all
            border
            cursor-pointer
            ${
              isOpen
                ? 'bg-hull/60 border-flux/30 text-snow shadow-[0_0_12px_-4px_rgba(56,189,248,0.4)]'
                : 'bg-hull/40 border-line/50 text-fog/70 hover:border-line/80 hover:text-mist'
            }
          `}
        >
          {currentOption?.color && (
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{
                backgroundColor:
                  currentOption.color,
                boxShadow: `0 0 6px ${currentOption.color}80`,
              }}
            />
          )}

          <span>
            {currentOption?.label}
          </span>

          <LuChevronDown
            className={`
              w-3
              h-3
              transition-transform
              duration-200
              ${
                isOpen
                  ? 'rotate-180'
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
            portalRoot
        )}
    </>
  );
}