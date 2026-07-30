import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Custom hook for handling keyboard navigation within menus/lists
 * (Arrow keys, Enter, Escape, and automatic scrolling into view)
 *
 * @param {Object} options
 * @param {number} options.itemCount - Total number of items in the list
 * @param {Function} options.onSelect - Callback triggered when an item is selected (Enter key)
 * @param {Function} options.onClose - Callback triggered when closing the menu (Escape key)
 * @param {string} [options.containerSelector] - CSS selector for the scrollable container
 * @param {number} [options.initialIndex=0] - Initial active item index
 */
export function useMenuNavigation({
  itemCount,
  onSelect,
  onClose,
  containerSelector = null,
  initialIndex = 0,
}) {
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const containerRef = useRef(null);

  // Reset or adjust index if itemCount changes dynamically (e.g., during search)
  useEffect(() => {
    if (itemCount === 0) {
      setSelectedIndex(-1);
    } else if (selectedIndex >= itemCount) {
      setSelectedIndex(itemCount - 1);
    } else if (selectedIndex < 0 && itemCount > 0) {
      setSelectedIndex(0);
    }
  }, [itemCount, selectedIndex]);

  // Handle automatic scrolling to keep selected item visible
  useEffect(() => {
    if (selectedIndex < 0) return;

    const container = containerSelector
      ? document.querySelector(containerSelector)
      : containerRef.current;

    if (!container) return;

    const selectedItem = container.children[selectedIndex];
    if (selectedItem) {
      const containerTop = container.scrollTop;
      const containerBottom = containerTop + container.clientHeight;
      const itemTop = selectedItem.offsetTop;
      const itemBottom = itemTop + selectedItem.offsetHeight;

      if (itemTop < containerTop) {
        container.scrollTop = itemTop;
      } else if (itemBottom > containerBottom) {
        container.scrollTop = itemBottom - container.clientHeight;
      }
    }
  }, [selectedIndex, containerSelector]);

  // Keyboard navigation listener
  const handleKeyDown = useCallback(
    (event) => {
      if (itemCount === 0) return false;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % itemCount);
          return true;

        case "ArrowUp":
          event.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + itemCount) % itemCount);
          return true;

        case "Enter":
          event.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < itemCount && onSelect) {
            onSelect(selectedIndex);
          }
          return true;

        case "Escape":
          event.preventDefault();
          if (onClose) onClose();
          return true;

        default:
          return false;
      }
    },
    [itemCount, selectedIndex, onSelect, onClose]
  );

  return {
    selectedIndex,
    setSelectedIndex,
    containerRef,
    handleKeyDown,
  };
}