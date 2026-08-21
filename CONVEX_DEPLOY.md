# نشر قاعدة البيانات على Convex.dev

## الخطوات

1. سجل دخول على https://www.convex.dev ثم أنشئ مشروع جديد.
2. من داخل مجلد `vs-development` شغّل:

```bash
npx convex dev
# أو
npx convex deploy
```

3. سيُنشأ المجلد `convex/_generated` تلقائياً وستُرفع الـ `schema.ts`.

## ما تم إنجازه في schema.ts

- جدول `users` مع `password` مشفرة بـ bcryptjs (لا يُخزن كنص عادي)
- جدول `teams`, `sales`, `evaluation_periods`
- جدول `evaluations` يحتوي بالضبط الحقول المطلوبة:
  `id, sales_id, team_leader_id, evaluation_period, product_knowledge, communication, needs_discovery, sales_process, crm_discipline, follow_up_activity, strengths, weaknesses, main_problem, employee_status, final_notes, status, created_at, updated_at, submitted_at`
- RBAC: كل query/mutation تستقبل `callerId` وتتحقق:
  - Admin: FULL ACCESS
  - Team Leader: يرى فقط تقييمات `team_leader_id === callerId` ويُمنع من الوصول لبيانات فريق آخر حتى بتغيير URL/ID (يُرجع 403)
- حماية جميع API Routes عبر `Authorization: Bearer <JWT>`

## كلمات المرور

- يتم تشفيرها في Next.js API قبل الحفظ: `bcrypt.hash(password, 10)`
- لا يُعاد إرسال الحقل `password` أبداً للعميل

## بعد النشر

ضع قيمة `NEXT_PUBLIC_CONVEX_URL` في `.env` ثم أعد تشغيل `npm run dev`.

> النظام يعمل أيضاً بدون Convex عبر fallback محلي (`data/app.db.json`) بنفس المنطق والـ RBAC، لضمان تجربة Login → Dashboard → Teams → Sales → Evaluation → Database → Reports بدون انقطاع.
