import { Card, CardContent, CardHeader } from '@/components/ui/card'
import HtmlContent from '@/components/ui/html-content'
import { FileText } from 'lucide-react'

export default function DescriptionCard({ content, title = "Descripción" }) {
  if (!content) return null

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#E2FF1B]" />
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
      </CardHeader>
      <CardContent>
        <div className="prose prose-invert max-w-none">
          <div className="text-gray-300 leading-relaxed">
            <HtmlContent content={content} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 