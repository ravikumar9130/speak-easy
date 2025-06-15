/**
 * Accessibility utilities for SpeakEasy
 */

export class AccessibilityManager {
  private static instance: AccessibilityManager;
  private announcements: HTMLElement | null = null;

  private constructor() {
    this.initializeScreenReaderSupport();
  }

  static getInstance(): AccessibilityManager {
    if (!AccessibilityManager.instance) {
      AccessibilityManager.instance = new AccessibilityManager();
    }
    return AccessibilityManager.instance;
  }

  private initializeScreenReaderSupport() {
    if (typeof window !== 'undefined') {
      // Create a live region for screen reader announcements
      this.announcements = document.createElement('div');
      this.announcements.setAttribute('aria-live', 'polite');
      this.announcements.setAttribute('aria-atomic', 'true');
      this.announcements.className = 'sr-only';
      this.announcements.id = 'accessibility-announcements';
      document.body.appendChild(this.announcements);
    }
  }

  /**
   * Announce text to screen readers
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    if (this.announcements) {
      this.announcements.setAttribute('aria-live', priority);
      this.announcements.textContent = message;
      
      // Clear after announcement to allow repeated announcements
      setTimeout(() => {
        if (this.announcements) {
          this.announcements.textContent = '';
        }
      }, 1000);
    }
  }

  /**
   * Set focus to an element with proper handling
   */
  setFocus(element: HTMLElement | null, options?: FocusOptions) {
    if (element && typeof element.focus === 'function') {
      element.focus(options);
    }
  }

  /**
   * Check if user prefers reduced motion
   */
  prefersReducedMotion(): boolean {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  }

  /**
   * Get high contrast preference
   */
  prefersHighContrast(): boolean {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-contrast: high)').matches;
    }
    return false;
  }

  /**
   * Check if user prefers dark mode
   */
  prefersDarkMode(): boolean {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  }

  /**
   * Add keyboard navigation support to an element
   */
  addKeyboardSupport(
    element: HTMLElement,
    onActivate: () => void,
    keys: string[] = ['Enter', ' ']
  ) {
    element.addEventListener('keydown', (event) => {
      if (keys.includes(event.key)) {
        event.preventDefault();
        onActivate();
      }
    });
  }

  /**
   * Create accessible notification
   */
  createAccessibleNotification(message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info') {
    const notification = {
      message,
      type,
      timestamp: new Date(),
      id: `notification-${Date.now()}`
    };

    // Announce to screen readers
    const priority = type === 'error' || type === 'warning' ? 'assertive' : 'polite';
    this.announce(`${type.charAt(0).toUpperCase() + type.slice(1)}: ${message}`, priority);

    return notification;
  }
}

/**
 * Hook for accessibility features
 */
export const useAccessibility = () => {
  const manager = AccessibilityManager.getInstance();
  
  return {
    announce: manager.announce.bind(manager),
    setFocus: manager.setFocus.bind(manager),
    prefersReducedMotion: manager.prefersReducedMotion.bind(manager),
    prefersHighContrast: manager.prefersHighContrast.bind(manager),
    prefersDarkMode: manager.prefersDarkMode.bind(manager),
    addKeyboardSupport: manager.addKeyboardSupport.bind(manager),
    createAccessibleNotification: manager.createAccessibleNotification.bind(manager)
  };
};

/**
 * Accessibility validation utilities
 */
export const AccessibilityValidator = {
  /**
   * Check if text has sufficient contrast ratio
   */
  checkContrastRatio(foreground: string, background: string): boolean {
    // This is a simplified check - in production, you'd use a proper color contrast library
    return true; // Placeholder implementation
  },

  /**
   * Validate if element is accessible
   */
  validateElement(element: HTMLElement): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check for alt text on images
    if (element.tagName === 'IMG' && !element.getAttribute('alt')) {
      issues.push('Image lacks alt text');
      suggestions.push('Add descriptive alt text for screen readers');
    }

    // Check for proper heading hierarchy
    if (element.tagName.match(/^H[1-6]$/)) {
      // Implement heading hierarchy check
    }

    // Check for keyboard accessibility
    if (element.getAttribute('tabindex') === '-1' && !element.getAttribute('aria-hidden')) {
      issues.push('Element may not be keyboard accessible');
      suggestions.push('Ensure element can be reached via keyboard navigation');
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };
  }
};