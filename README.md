# 번호수첩

이름·전화번호·그룹·메모를 저장하고, 초성 검색으로 빠르게 찾는 전화번호부 웹사이트입니다.

- 프레임워크: Next.js 16 (App Router, TypeScript)
- 데이터베이스: Supabase (PostgreSQL)
- 배포: Vercel

## 기능

- 연락처 추가 / 수정 / 삭제 (삭제는 두 번 눌러 확인)
- 즐겨찾기(★) 토글
- 그룹 필터 (가족·친구·직장·기타 + 직접 입력한 그룹)
- 검색: 이름, 번호, 그룹, 메모. 초성(`ㅎㄱㄷ`)으로도 검색
- 국내 전화번호 자동 하이픈 (010-1234-5678, 02-123-4567, 1588-1234 등)
- 초성별로 묶인 목록과 오른쪽 색인 레일
- 번호 한 번에 복사
- 라이트 / 다크 테마 자동

## 1. Supabase 준비

1. <https://supabase.com> 에서 새 프로젝트를 만듭니다.
2. 왼쪽 메뉴 **SQL Editor** 를 열고 `supabase/schema.sql` 내용을 붙여넣은 뒤 **Run** 합니다.
   `contacts` 테이블, 인덱스, `updated_at` 트리거, RLS 정책이 만들어집니다.
3. **Project Settings → API** 에서 다음 두 값을 복사합니다.
   - Project URL
   - `anon` `public` API key

> 로그인 기능이 없으므로 RLS 정책은 anon 키로 모든 읽기/쓰기를 허용합니다.
> 개인용으로만 쓰세요. 다른 사람과 공유하거나 공개하려면 Supabase Auth 를 붙이고
> 정책을 `auth.uid()` 기준으로 좁혀야 합니다.

## 2. 로컬 실행

```bash
cp .env.example .env.local   # Windows: copy .env.example .env.local
# .env.local 을 열어 URL 과 anon key 를 채웁니다
npm install
npm run dev
```

<http://localhost:3000> 에서 확인합니다.

## 3. Vercel 배포

1. 이 폴더를 GitHub 저장소에 올립니다.
2. <https://vercel.com/new> 에서 저장소를 Import 합니다. 프레임워크는 Next.js 로 자동 감지됩니다.
3. **Environment Variables** 에 아래 두 값을 추가합니다.
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **Deploy** 를 누릅니다.

CLI 로 배포하려면:

```bash
npm i -g vercel
vercel          # 프로젝트 연결 (처음 한 번)
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel --prod
```

## 폴더 구조

```
app/
  layout.tsx                 폰트, 메타데이터
  page.tsx                   서버에서 연락처를 읽어 첫 화면에 전달
  globals.css                디자인 토큰과 전체 스타일
  components/PhoneBook.tsx   목록·검색·필터·추가/수정 다이얼로그
lib/
  supabase.ts                Supabase 클라이언트 (브라우저 / 서버)
  phone.ts                   전화번호 하이픈, 초성 색인, 초성 검색
  types.ts                   Contact 타입
supabase/
  schema.sql                 테이블·트리거·RLS 정책
```
