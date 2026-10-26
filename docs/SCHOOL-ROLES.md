# School role and ownership rules

| Account / capability | Read scope | Allowed changes |
| --- | --- | --- |
| Administrator | School-wide records | Manage classes/enrollment, teaching records, account associations and student links |
| Staff | School-wide records | Manage school rosters/enrollment and teaching records; cannot assign account associations through School Access |
| Teacher | Classes whose teacherId matches the signed-in account; students in those classes | Attendance, assignments and reports for those students; cannot create/delete classes, change rosters, or assign accounts |
| Student | Student record linked by userId to the signed-in account | No attendance, grading, report or roster writes |
| Verified parent | Children linked to the verified account email | Read family attendance/reports/assignments; no school-record edits |
| Unverified member / guest | No private school records | Public enrollment submission remains available |

Parent access is a verified family capability, not an elevated global role. The existing account enum remains admin/teacher/staff/member/student. A verified teacher can separately use the family endpoint for their own children; teaching access remains scoped by class assignment. Parent lookup never authorizes reading an unrelated child by submitting another email or student ID.

## Required setup

1. Apply `20261028000000_school_account_links` after prior migrations.
2. Sign in as administrator and open Dashboard → School Access.
3. Assign an active teacher account to each class. Teacher display names alone grant no access.
4. Link each student account to its enrolled student record. One student account links to one record in the current model.
5. Verify parent accounts through a trusted school process and ensure enrollment records have the correct parent email.
6. Test using separate real accounts: teacher A cannot read/write class B; student A cannot read student B; parent A cannot read family B; revoked class assignments stop working on subsequent requests.

Existing records are not automatically linked by name. Unassigned teachers/students fail closed until an administrator links them. Changing role or disabling an account is rechecked by the auth helper; class ownership is queried during access.

## Implemented enforcement

Shared `school-access.ts` filters are used for classroom roster reads, assignments, attendance, report APIs, legacy parent portal queries and student-detail queries. Reports now require sign-in. Management mutations require school manager permission. Teacher attendance submissions validate access to the class and membership of all selected students before writing. Assignment updates cannot move a record to another student or teacher. Only the validated administrator association endpoint can change teacherId/student userId through roster APIs. Mobile school labels distinguish teacher/student/parent views and its student/homework services use implemented, scoped endpoints.

## Remaining release checks

These are code changes, not proof of complete school readiness. No live migration or assignment setup has run. Validate the scoped endpoints against a real database, including concurrent reassignment and writes. Improve validation, pagination, error responses and atomic bulk attendance writes. Complete the dedicated teacher/student mobile dashboards, real check-in sessions, tuition, grades and formal report cards. Review all school-related dashboards, exports/search and future routes for the same scope rules. Verify parent identity and enrollment administration procedures operationally; email must never be self-verified by an untrusted caller.

### Attendance save rules

Teachers can mark only active students currently in their assigned class; managers retain school-wide access. The server validates the entire batch before writing and saves it in one serializable transaction with its derived rates. Duplicate students, unsupported statuses, malformed IDs/dates and oversized batches are rejected. A record already owned by a different class on the same student/day returns a conflict, including after a class transfer. Students and parents cannot mark attendance.

Use a date-only `YYYY-MM-DD` value; storage uses UTC midnight to represent that calendar day. Existing production dates need review before rollout if previously written using server-local midnight. The current schema supports one attendance record per student/day, not separate sessions. Late and excused still count as non-present in the existing rate formula; agree on school policy before release.

### Student attendance history

`GET /api/students/me/attendance?page=1` is student-only and derives the active enrollment from the authenticated account's `userId` link. It accepts no student/account selector. Responses contain only the student's name, class, date/status history and aggregate status counts, with 30 records per page and no-store caching. Read queries use a consistent database snapshot. Notes, parent contacts, and staff identifiers are excluded.

Mobile students open **View my attendance** from School; member parents open **View family attendance** through the existing verified-family endpoint. The legacy check-in URL now opens the real history screen and clearly explains that teachers/staff record attendance. This does not implement self-check-in: session verification and its school policy are still pending.
