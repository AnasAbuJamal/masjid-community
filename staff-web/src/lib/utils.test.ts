import { describe, it, expect } from 'vitest';
import {
    formatCurrency,
    formatDate,
    formatDateTime,
    slugify,
    generateStudentId,
    getAttendanceColor,
    getStatusColor,
    cn,
} from '../lib/utils';

describe('utils', () => {
    describe('formatCurrency', () => {
        it('formats number as USD currency', () => {
            expect(formatCurrency(1000)).toBe('$1,000.00');
            expect(formatCurrency(0)).toBe('$0.00');
            expect(formatCurrency(99.99)).toBe('$99.99');
        });
    });

    describe('formatDate', () => {
        it('formats Date object', () => {
            const result = formatDate(new Date(2024, 0, 15));
            expect(result).toContain('Jan');
            expect(result).toContain('15');
            expect(result).toContain('2024');
        });

        it('formats string date', () => {
            const result = formatDate('2024-06-20');
            expect(result).toContain('Jun');
            expect(result).toContain('20');
            expect(result).toContain('2024');
        });
    });

    describe('formatDateTime', () => {
        it('formats date with time', () => {
            const result = formatDateTime(new Date('2024-01-15T14:30:00'));
            expect(result).toContain('Jan');
            expect(result).toContain('15');
            expect(result).toContain('2024');
        });
    });

    describe('slugify', () => {
        it('converts text to slug format', () => {
            expect(slugify('Hello World')).toBe('hello-world');
            expect(slugify('Test String 123')).toBe('test-string-123');
        });

        it('removes special characters', () => {
            expect(slugify('Hello, World!')).toBe('hello-world');
            expect(slugify('Test@#$%^&*()')).toBe('test');
        });

        it('handles multiple spaces and hyphens', () => {
            expect(slugify('hello   world')).toBe('hello-world');
            expect(slugify('hello_-world')).toBe('hello-world');
        });

        it('trims leading and trailing hyphens', () => {
            expect(slugify('  hello  ')).toBe('hello');
            expect(slugify('---hello---')).toBe('hello');
        });
    });

    describe('generateStudentId', () => {
        it('generates student ID with correct format', () => {
            const id = generateStudentId();
            expect(id).toMatch(/^STU-\d{4}-\d{3}$/);
        });

        it('generates student IDs in correct format', () => {
            const ids = new Set(Array.from({ length: 100 }, () => generateStudentId()));
            expect(ids.size).toBeGreaterThanOrEqual(90);
            ids.forEach(id => {
                expect(id).toMatch(/^STU-\d{4}-\d{3}$/);
            });
        });
    });

    describe('getAttendanceColor', () => {
        it('returns correct colors for attendance statuses', () => {
            expect(getAttendanceColor('excellent')).toBe('text-green-500');
            expect(getAttendanceColor('very_good')).toBe('text-blue-500');
            expect(getAttendanceColor('good')).toBe('text-yellow-500');
            expect(getAttendanceColor('needs_improvement')).toBe('text-orange-500');
            expect(getAttendanceColor('poor')).toBe('text-red-500');
        });

        it('returns default color for unknown status', () => {
            expect(getAttendanceColor('unknown')).toBe('text-gray-500');
        });
    });

    describe('getStatusColor', () => {
        it('returns correct colors for various statuses', () => {
            expect(getStatusColor('pending')).toBe('bg-yellow-100 text-yellow-800');
            expect(getStatusColor('approved')).toBe('bg-green-100 text-green-800');
            expect(getStatusColor('rejected')).toBe('bg-red-100 text-red-800');
            expect(getStatusColor('active')).toBe('bg-green-100 text-green-800');
            expect(getStatusColor('completed')).toBe('bg-blue-100 text-blue-800');
        });

        it('returns default color for unknown status', () => {
            expect(getStatusColor('unknown')).toBe('bg-gray-100 text-gray-800');
        });
    });

    describe('cn', () => {
        it('merges class names', () => {
            expect(cn('foo', 'bar')).toBe('foo bar');
            expect(cn('foo', false && 'bar')).toBe('foo');
            expect(cn('foo', null, 'bar')).toBe('foo bar');
        });
    });
});
