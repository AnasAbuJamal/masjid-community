import { describe, it, expect } from 'vitest';
import {
  validateForm,
  validateField,
  emailSchema,
  phoneSchema,
  nameSchema,
  studentEnrollmentSchema,
  rentalBookingSchema,
} from '../../utils/validation';

describe('validation utilities', () => {
  describe('email validation', () => {
    it('should validate correct emails', () => {
      expect(validateField(emailSchema, 'test@example.com')).toBeNull();
      expect(validateField(emailSchema, 'user.name@domain.org')).toBeNull();
      expect(validateField(emailSchema, 'user+tag@example.co.uk')).toBeNull();
    });

    it('should reject invalid emails', () => {
      expect(validateField(emailSchema, 'invalid')).not.toBeNull();
      expect(validateField(emailSchema, 'test@')).not.toBeNull();
      expect(validateField(emailSchema, '@example.com')).not.toBeNull();
      expect(validateField(emailSchema, 'test@example')).not.toBeNull();
      expect(validateField(emailSchema, '')).not.toBeNull();
    });
  });

  describe('phone validation', () => {
    it('should validate phone numbers', () => {
      expect(validateField(phoneSchema, '1234567890')).toBeNull();
      expect(validateField(phoneSchema, '123-456-7890')).toBeNull();
      expect(validateField(phoneSchema, '+1 123-456-7890')).toBeNull();
      expect(validateField(phoneSchema, '(555) 123-4567')).toBeNull();
    });

    it('should reject invalid phones', () => {
      expect(validateField(phoneSchema, '123')).not.toBeNull();
      expect(validateField(phoneSchema, 'abcdefghij')).not.toBeNull();
      expect(validateField(phoneSchema, '')).not.toBeNull();
    });
  });

  describe('name validation', () => {
    it('should validate names', () => {
      expect(validateField(nameSchema, 'John Doe')).toBeNull();
      expect(validateField(nameSchema, "Mary O'Brien")).toBeNull();
      expect(validateField(nameSchema, 'Ahmed Ali')).toBeNull();
    });

    it('should reject invalid names', () => {
      expect(validateField(nameSchema, 'J')).not.toBeNull();
      expect(validateField(nameSchema, 'John123')).not.toBeNull();
      expect(validateField(nameSchema, '')).not.toBeNull();
    });
  });

  describe('studentEnrollmentSchema', () => {
    it('should validate complete enrollment data', () => {
      const data = {
        studentName: 'Ahmed Ali',
        dateOfBirth: '2015-03-15',
        gradeLevel: '4th Grade' as any,
        parentName: 'Fatima Ali',
        parentEmail: 'fatima@example.com',
        parentPhone: '555-123-4567',
        programName: 'Quran Classes (Weekend)',
        notes: 'Special needs: None',
        emergencyContactName: 'Grandfather',
        emergencyContactPhone: '555-987-6543',
        emergencyRelation: 'Grandfather',
        parentPreferredContact: 'email' as const,
      };

      const errors = validateForm(studentEnrollmentSchema, data);
      expect(errors).toEqual({});
    });

    it('should reject enrollment with missing required fields', () => {
      const data = {
        studentName: '',
        dateOfBirth: '',
        gradeLevel: '' as any,
        parentName: '',
        parentEmail: 'invalid',
        parentPhone: '',
        programName: '',
        notes: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        emergencyRelation: '',
        parentPreferredContact: 'email' as const,
      };

      const errors = validateForm(studentEnrollmentSchema, data);
      expect(Object.keys(errors).length).toBeGreaterThan(0);
    });
  });

  describe('rentalBookingSchema', () => {
    it('should validate complete booking data', () => {
      const data = {
        renterName: 'John Smith',
        renterEmail: 'john@example.com',
        renterPhone: '555-123-4567',
        eventName: 'Wedding Reception',
        startDate: '2024-12-25',
        endDate: '2024-12-26',
        priceType: 'daily' as const,
      };

      const errors = validateForm(rentalBookingSchema, data);
      expect(errors).toEqual({});
    });

    it('should reject booking with missing required fields', () => {
      const data = {
        renterName: '',
        renterEmail: '',
        renterPhone: '',
        eventName: '',
        startDate: '',
        endDate: '',
        priceType: 'daily' as const,
      };

      const errors = validateForm(rentalBookingSchema, data);
      expect(Object.keys(errors).length).toBeGreaterThan(0);
    });
  });

  describe('URL validation', () => {
    const isValidUrl = (url: string): boolean => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    };

    it('should validate URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://example.com')).toBe(true);
      expect(isValidUrl('https://example.com/path?query=1')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('example.com')).toBe(false);
    });
  });

  describe('text formatting', () => {
    const formatPhoneNumber = (phone: string): string => {
      const digits = phone.replace(/\D/g, '');
      if (digits.length === 10) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
      }
      return phone;
    };

    it('should format 10-digit numbers', () => {
      expect(formatPhoneNumber('1234567890')).toBe('(123) 456-7890');
    });

    const truncateText = (text: string, maxLength: number, ellipsis = '...'): string => {
      if (text.length <= maxLength) return text;
      return text.slice(0, maxLength - ellipsis.length) + ellipsis;
    };

    it('should truncate long text', () => {
      expect(truncateText('This is a very long text', 10)).toBe('This is...');
      expect(truncateText('Short', 10)).toBe('Short');
    });

    const capitalize = (str: string): string => {
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    };

    it('should capitalize first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('HELLO')).toBe('Hello');
    });
  });

  describe('clamp', () => {
    const clamp = (value: number, min: number, max: number): number => {
      return Math.min(Math.max(value, min), max);
    };

    it('should clamp values within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });
});
