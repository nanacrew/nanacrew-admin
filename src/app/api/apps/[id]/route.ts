import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

type Params = {
  params: Promise<{
    id: string
  }>
}

// DELETE /api/apps/[id] - Delete app
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params

    // 앱 삭제 (CASCADE로 연결된 버전, 서비스, 분석 데이터도 모두 삭제됨)
    const { error } = await supabase
      .from('apps')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting app:', error)
    return NextResponse.json(
      { error: 'Failed to delete app' },
      { status: 500 }
    )
  }
}
