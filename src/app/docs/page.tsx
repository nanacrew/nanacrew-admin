'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function DocsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">API 문서</h1>
        <p className="text-muted-foreground">NanaCrew Admin API 사용 가이드</p>
      </div>

      <div className="space-y-6">
        {/* Version Check API */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="font-mono">GET</Badge>
              <CardTitle>버전 체크 API</CardTitle>
            </div>
            <CardDescription>앱의 최신 버전을 확인하고 업데이트가 필요한지 체크합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Endpoint</h4>
              <div className="bg-zinc-900 text-zinc-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                GET /api/version-check
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Query Parameters</h4>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Badge variant="secondary">packageName</Badge>
                  <span className="text-sm text-muted-foreground">앱의 패키지명 (예: com.example.app)</span>
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary">currentVersion</Badge>
                  <span className="text-sm text-muted-foreground">현재 앱 버전 (예: 1.0.0)</span>
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary">platform</Badge>
                  <span className="text-sm text-muted-foreground">플랫폼 (android 또는 ios)</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Example Request</h4>
              <div className="bg-zinc-900 text-zinc-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                curl "https://your-domain.com/api/version-check?packageName=com.example.app&currentVersion=1.0.0&platform=android"
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Response Format</h4>
              <div className="bg-zinc-900 text-zinc-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
{`{
  "needsUpdate": true,
  "forceUpdate": false,
  "latestVersion": "1.1.0",
  "minimumVersion": "1.0.0",
  "updateMessage": "새로운 기능이 추가되었습니다",
  "downloadUrl": "https://play.google.com/store/apps/details?id=com.example.app",
  "features": [
    "버그 수정",
    "성능 개선",
    "새로운 기능 추가"
  ]
}`}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Response Fields</h4>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Badge variant="secondary">needsUpdate</Badge>
                  <span className="text-sm text-muted-foreground">업데이트가 필요한지 여부</span>
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary">forceUpdate</Badge>
                  <span className="text-sm text-muted-foreground">강제 업데이트 필요 여부</span>
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary">latestVersion</Badge>
                  <span className="text-sm text-muted-foreground">최신 버전</span>
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary">minimumVersion</Badge>
                  <span className="text-sm text-muted-foreground">지원하는 최소 버전</span>
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary">updateMessage</Badge>
                  <span className="text-sm text-muted-foreground">업데이트 메시지</span>
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary">downloadUrl</Badge>
                  <span className="text-sm text-muted-foreground">다운로드 URL</span>
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary">features</Badge>
                  <span className="text-sm text-muted-foreground">업데이트 내용 목록</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Track API */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="font-mono bg-green-50 text-green-700 border-green-300">POST</Badge>
              <CardTitle>통계 추적 API</CardTitle>
            </div>
            <CardDescription>앱 접속 및 버전 정보를 기록합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Endpoint</h4>
              <div className="bg-zinc-900 text-zinc-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                POST /api/analytics/track
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Request Body</h4>
              <div className="bg-zinc-900 text-zinc-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
{`{
  "packageName": "com.example.app",
  "platform": "android",
  "version": "1.0.0",
  "userId": "optional-user-id"
}`}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Example Request</h4>
              <div className="bg-zinc-900 text-zinc-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
{`curl -X POST "https://your-domain.com/api/analytics/track" \\
  -H "Content-Type: application/json" \\
  -d '{
    "packageName": "com.example.app",
    "platform": "android",
    "version": "1.0.0"
  }'`}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Response</h4>
              <div className="bg-zinc-900 text-zinc-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
{`{
  "success": true
}`}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Flutter Integration Guide */}
        <Card>
          <CardHeader>
            <CardTitle>Flutter 통합 가이드</CardTitle>
            <CardDescription>Flutter 앱에서 버전 체크를 구현하는 방법</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">1. 패키지 추가</h4>
              <div className="bg-zinc-900 text-zinc-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
{`dependencies:
  http: ^1.1.0
  package_info_plus: ^5.0.1`}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">2. 버전 체크 함수 구현</h4>
              <div className="bg-zinc-900 text-zinc-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
{`import 'package:http/http.dart' as http;
import 'package:package_info_plus/package_info_plus.dart';
import 'dart:convert';

Future<Map<String, dynamic>> checkVersion() async {
  final packageInfo = await PackageInfo.fromPlatform();
  final packageName = packageInfo.packageName;
  final currentVersion = packageInfo.version;
  final platform = Platform.isAndroid ? 'android' : 'ios';

  final url = Uri.parse(
    'https://your-domain.com/api/version-check'
    '?packageName=$packageName'
    '&currentVersion=$currentVersion'
    '&platform=$platform'
  );

  final response = await http.get(url);

  if (response.statusCode == 200) {
    return json.decode(response.body);
  } else {
    throw Exception('Failed to check version');
  }
}`}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">3. 통계 전송 함수 구현</h4>
              <div className="bg-zinc-900 text-zinc-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
{`Future<void> trackAnalytics() async {
  final packageInfo = await PackageInfo.fromPlatform();
  final platform = Platform.isAndroid ? 'android' : 'ios';

  final url = Uri.parse('https://your-domain.com/api/analytics/track');

  await http.post(
    url,
    headers: {'Content-Type': 'application/json'},
    body: json.encode({
      'packageName': packageInfo.packageName,
      'platform': platform,
      'version': packageInfo.version,
    }),
  );
}`}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">4. 앱 시작 시 호출</h4>
              <div className="bg-zinc-900 text-zinc-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
{`@override
void initState() {
  super.initState();

  // 버전 체크
  checkVersion().then((result) {
    if (result['needsUpdate']) {
      showUpdateDialog(result);
    }
  });

  // 통계 전송
  trackAnalytics();
}`}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rate Limits */}
        <Card>
          <CardHeader>
            <CardTitle>요청 제한</CardTitle>
            <CardDescription>API 사용 시 주의사항</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>버전 체크 API는 앱 시작 시 1회만 호출하는 것을 권장합니다</li>
              <li>통계 API는 일 1회 호출을 권장합니다 (중복 호출 시 자동으로 처리됨)</li>
              <li>과도한 요청 시 일시적으로 차단될 수 있습니다</li>
              <li>에러 발생 시 재시도는 exponential backoff 패턴을 사용하세요</li>
            </ul>
          </CardContent>
        </Card>

        {/* Error Codes */}
        <Card>
          <CardHeader>
            <CardTitle>에러 코드</CardTitle>
            <CardDescription>API 에러 응답 처리</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex gap-3">
                <Badge variant="destructive">400</Badge>
                <div>
                  <p className="font-semibold text-sm">Bad Request</p>
                  <p className="text-sm text-muted-foreground">필수 파라미터가 누락되었거나 잘못된 형식입니다</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Badge variant="destructive">404</Badge>
                <div>
                  <p className="font-semibold text-sm">Not Found</p>
                  <p className="text-sm text-muted-foreground">등록되지 않은 앱 또는 버전입니다</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Badge variant="destructive">500</Badge>
                <div>
                  <p className="font-semibold text-sm">Internal Server Error</p>
                  <p className="text-sm text-muted-foreground">서버 오류가 발생했습니다. 잠시 후 다시 시도하세요</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
