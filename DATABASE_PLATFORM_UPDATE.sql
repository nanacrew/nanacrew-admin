-- 기존 apps 테이블의 platform 컬럼을 배열로 변경
-- 1. 임시 컬럼 추가
ALTER TABLE apps ADD COLUMN platforms TEXT[];

-- 2. 기존 데이터 마이그레이션
UPDATE apps SET platforms = ARRAY[platform];

-- 3. 기존 컬럼 삭제
ALTER TABLE apps DROP COLUMN platform;

-- 4. 임시 컬럼 이름 변경
ALTER TABLE apps RENAME COLUMN platforms TO platform;

-- 5. NOT NULL 제약 추가
ALTER TABLE apps ALTER COLUMN platform SET NOT NULL;

-- 6. 체크 제약 추가 (배열 요소가 android 또는 ios만 가능)
ALTER TABLE apps ADD CONSTRAINT check_platform_values
  CHECK (platform <@ ARRAY['android', 'ios']::TEXT[]);

-- 주석 업데이트
COMMENT ON COLUMN apps.platform IS '지원 플랫폼 배열 (android, ios 중 하나 이상)';
