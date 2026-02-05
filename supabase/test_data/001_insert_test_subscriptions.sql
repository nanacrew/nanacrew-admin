-- 테스트용 구독 데이터 생성
-- 먼저 에어노트 앱 ID를 가져옵니다

DO $$
DECLARE
  air_note_id UUID;
BEGIN
  -- 에어노트 앱 ID 가져오기
  SELECT id INTO air_note_id FROM apps WHERE name = '에어노트' LIMIT 1;

  -- 테스트 구독 데이터 삽입
  IF air_note_id IS NOT NULL THEN
    -- 1. 활성 무료 구독
    INSERT INTO subscriptions (app_id, user_identifier, subscription_type, status, start_date, notes)
    VALUES
      (air_note_id, 'user1@example.com', 'free', 'active', NOW() - INTERVAL '30 days', '관리자가 무료로 제공한 계정'),
      (air_note_id, 'test.user@gmail.com', 'free', 'active', NOW() - INTERVAL '15 days', '베타 테스터'),
      (air_note_id, '010-1234-5678', 'free', 'active', NOW() - INTERVAL '5 days', '초기 사용자 무료 제공');

    -- 2. 활성 유료 구독
    INSERT INTO subscriptions (app_id, user_identifier, subscription_type, status, start_date, end_date, notes)
    VALUES
      (air_note_id, 'premium@example.com', 'paid', 'active', NOW() - INTERVAL '10 days', NOW() + INTERVAL '350 days', '1년 구독'),
      (air_note_id, '010-9876-5432', 'paid', 'active', NOW() - INTERVAL '2 days', NOW() + INTERVAL '28 days', '월간 구독');

    -- 3. 체험 구독 (활성)
    INSERT INTO subscriptions (app_id, user_identifier, subscription_type, status, start_date, end_date, notes)
    VALUES
      (air_note_id, 'trial@example.com', 'trial', 'active', NOW() - INTERVAL '3 days', NOW() + INTERVAL '4 days', '7일 무료 체험'),
      (air_note_id, 'newuser@test.com', 'trial', 'active', NOW() - INTERVAL '1 day', NOW() + INTERVAL '6 days', '신규 가입자 체험');

    -- 4. 만료된 구독
    INSERT INTO subscriptions (app_id, user_identifier, subscription_type, status, start_date, end_date, notes)
    VALUES
      (air_note_id, 'expired@example.com', 'trial', 'expired', NOW() - INTERVAL '30 days', NOW() - INTERVAL '3 days', '체험 기간 종료'),
      (air_note_id, 'old.user@gmail.com', 'paid', 'expired', NOW() - INTERVAL '400 days', NOW() - INTERVAL '30 days', '구독 갱신 안함');

    -- 5. 정지된 구독
    INSERT INTO subscriptions (app_id, user_identifier, subscription_type, status, start_date, notes)
    VALUES
      (air_note_id, 'suspended@example.com', 'paid', 'suspended', NOW() - INTERVAL '20 days', '약관 위반으로 정지'),
      (air_note_id, 'banned@test.com', 'free', 'suspended', NOW() - INTERVAL '10 days', '부적절한 사용');

    -- 6. 취소된 구독
    INSERT INTO subscriptions (app_id, user_identifier, subscription_type, status, start_date, end_date, notes)
    VALUES
      (air_note_id, 'cancelled@example.com', 'paid', 'cancelled', NOW() - INTERVAL '60 days', NOW() - INTERVAL '30 days', '사용자 요청으로 취소');

    -- 활성 세션 추가 (일부 사용자만 로그인 중)
    INSERT INTO user_sessions (subscription_id, session_token, device_info, ip_address, last_active, expires_at)
    SELECT
      s.id,
      md5(random()::text || clock_timestamp()::text)::text,
      'iPhone 15 Pro, iOS 17.2',
      '192.168.1.' || (100 + (random() * 50)::int)::text,
      NOW() - INTERVAL '5 minutes',
      NOW() + INTERVAL '30 days'
    FROM subscriptions s
    WHERE s.user_identifier IN ('user1@example.com', 'premium@example.com', 'trial@example.com')
    AND s.app_id = air_note_id;

    RAISE NOTICE 'Test subscription data created successfully!';
  ELSE
    RAISE NOTICE 'App "에어노트" not found. Please create the app first.';
  END IF;
END $$;
