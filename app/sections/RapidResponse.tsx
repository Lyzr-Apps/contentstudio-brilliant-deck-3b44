'use client'

import React, { useState } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { FiAlertTriangle, FiShield, FiChevronDown, FiChevronRight, FiCopy, FiCheck } from 'react-icons/fi'

const CRISIS_AGENT_ID = '69a1747cf03a54d775b55b1e'

interface CrisisResponse {
  classification: string
  threat_level: string
  source_analysis: string
  recommended_strategy: string
  draft_response: string
  talking_points: string
  do_not_say: string
  escalation_notes: string
}

interface RapidResponseProps {
  setActiveAgentId: (id: string | null) => void
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## ')) return <h3 key={i} className="font-semibold text-base mt-3 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('# ')) return <h2 key={i} className="font-bold text-lg mt-4 mb-2">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-sm">{formatInlineContent(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-4 list-decimal text-sm">{formatInlineContent(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm">{formatInlineContent(line)}</p>
      })}
    </div>
  )
}

function formatInlineContent(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
  )
}

function getThreatColor(level: string): string {
  const l = (level ?? '').toLowerCase()
  if (l.includes('critical')) return 'bg-red-700 text-white'
  if (l.includes('high')) return 'bg-orange-600 text-white'
  if (l.includes('medium')) return 'bg-yellow-600 text-white'
  if (l.includes('low')) return 'bg-green-700 text-white'
  return 'bg-muted text-muted-foreground'
}

export default function RapidResponse({ setActiveAgentId }: RapidResponseProps) {
  const [attackText, setAttackText] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [response, setResponse] = useState<CrisisResponse | null>(null)
  const [editableResponse, setEditableResponse] = useState<string>('')
  const [talkingPointsOpen, setTalkingPointsOpen] = useState(false)
  const [doNotSayOpen, setDoNotSayOpen] = useState(false)
  const [escalationOpen, setEscalationOpen] = useState(false)
  const [sourceOpen, setSourceOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [approved, setApproved] = useState(false)

  const handleAnalyze = async () => {
    if (!attackText.trim()) {
      setError('Please paste the criticism or attack text to analyze.')
      return
    }
    setLoading(true)
    setError(null)
    setResponse(null)
    setApproved(false)
    setActiveAgentId(CRISIS_AGENT_ID)

    try {
      const result = await callAIAgent(
        `Analyze this criticism/attack: ${attackText}`,
        CRISIS_AGENT_ID
      )

      if (result?.success) {
        const data = result?.response?.result
        const crisisData: CrisisResponse = {
          classification: data?.classification ?? '',
          threat_level: data?.threat_level ?? '',
          source_analysis: data?.source_analysis ?? '',
          recommended_strategy: data?.recommended_strategy ?? '',
          draft_response: data?.draft_response ?? '',
          talking_points: data?.talking_points ?? '',
          do_not_say: data?.do_not_say ?? '',
          escalation_notes: data?.escalation_notes ?? '',
        }
        setResponse(crisisData)
        setEditableResponse(crisisData.draft_response)
      } else {
        setError(result?.error ?? 'Failed to analyze. Please try again.')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
      setActiveAgentId(null)
    }
  }

  const handleCopy = () => {
    if (editableResponse) {
      navigator.clipboard.writeText(editableResponse).catch(() => {})
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleApproveResponse = () => {
    setApproved(true)
  }

  const handleAdoptSilence = () => {
    setEditableResponse('')
    setApproved(true)
  }

  const isSilenceStrategy = (response?.recommended_strategy ?? '').toLowerCase().includes('silence')

  return (
    <ScrollArea className="h-full">
      <div className="space-y-6 pb-6">
        {/* Input Area */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="font-serif tracking-wide text-lg flex items-center gap-2">
              <FiShield className="w-5 h-5 text-accent" />
              Crisis Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-sans text-muted-foreground">
                Paste the criticism, attack, or negative content below
              </Label>
              <Textarea
                placeholder="Paste the full text of the criticism or attack here. Include the source if known (e.g., social media post, news article, opposition statement)..."
                value={attackText}
                onChange={(e) => setAttackText(e.target.value)}
                className="bg-input border-border min-h-[140px] resize-none text-sm leading-relaxed"
              />
            </div>
            <Button
              onClick={handleAnalyze}
              disabled={loading || !attackText.trim()}
              className="bg-accent text-accent-foreground hover:bg-accent/90 font-sans"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                  Analyzing...
                </span>
              ) : (
                'Analyze & Respond'
              )}
            </Button>

            {error && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                {error}
                <button onClick={handleAnalyze} className="block mt-1 text-xs underline hover:no-underline">Retry</button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <Card className="bg-card border-border">
            <CardContent className="p-6 space-y-4">
              <div className="flex gap-2">
                <Skeleton className="h-6 w-28 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {!loading && response && (
          <div className="space-y-4">
            {/* Classification Panel */}
            <Card className="bg-card border-border">
              <CardContent className="p-5">
                <div className="flex flex-wrap gap-3 items-center mb-4">
                  {response.classification && (
                    <Badge variant="outline" className="text-sm py-1 px-3">
                      <FiAlertTriangle className="w-3.5 h-3.5 mr-1.5" />
                      {response.classification}
                    </Badge>
                  )}
                  {response.threat_level && (
                    <Badge className={`text-sm py-1 px-3 ${getThreatColor(response.threat_level)}`}>
                      {response.threat_level}
                    </Badge>
                  )}
                </div>

                {response.recommended_strategy && (
                  <div className="mb-4">
                    <Label className="text-xs font-sans text-muted-foreground">Recommended Strategy</Label>
                    <div className="mt-1 text-sm leading-relaxed">{renderMarkdown(response.recommended_strategy)}</div>
                  </div>
                )}

                {/* Source Analysis */}
                {response.source_analysis && (
                  <Collapsible open={sourceOpen} onOpenChange={setSourceOpen}>
                    <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full mt-2">
                      {sourceOpen ? <FiChevronDown className="w-4 h-4" /> : <FiChevronRight className="w-4 h-4" />}
                      Source Analysis
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-2">
                      <div className="p-3 rounded-md bg-muted/30 border border-border text-sm leading-relaxed">
                        {renderMarkdown(response.source_analysis)}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </CardContent>
            </Card>

            {/* Draft Response Panel */}
            {!isSilenceStrategy && (
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="font-serif tracking-wide text-base">Draft Response</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    value={editableResponse}
                    onChange={(e) => setEditableResponse(e.target.value)}
                    className="bg-input border-border min-h-[120px] text-sm leading-relaxed"
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{(editableResponse ?? '').length} characters</p>
                    <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 px-2 text-xs">
                      {copied ? <FiCheck className="w-3.5 h-3.5 mr-1" /> : <FiCopy className="w-3.5 h-3.5 mr-1" />}
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Talking Points, Do Not Say, Escalation */}
            <Card className="bg-card border-border">
              <CardContent className="p-5 space-y-3">
                {response.talking_points && (
                  <Collapsible open={talkingPointsOpen} onOpenChange={setTalkingPointsOpen}>
                    <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full">
                      {talkingPointsOpen ? <FiChevronDown className="w-4 h-4" /> : <FiChevronRight className="w-4 h-4" />}
                      Talking Points
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-2">
                      <div className="p-3 rounded-md bg-muted/30 border border-border text-sm leading-relaxed">
                        {renderMarkdown(response.talking_points)}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {response.do_not_say && (
                  <Collapsible open={doNotSayOpen} onOpenChange={setDoNotSayOpen}>
                    <CollapsibleTrigger className="flex items-center gap-2 text-sm text-destructive hover:text-destructive/80 transition-colors w-full">
                      {doNotSayOpen ? <FiChevronDown className="w-4 h-4" /> : <FiChevronRight className="w-4 h-4" />}
                      Do Not Say
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-2">
                      <div className="p-3 rounded-md bg-destructive/5 border border-destructive/20 text-sm leading-relaxed">
                        {renderMarkdown(response.do_not_say)}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {response.escalation_notes && (
                  <Collapsible open={escalationOpen} onOpenChange={setEscalationOpen}>
                    <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full">
                      {escalationOpen ? <FiChevronDown className="w-4 h-4" /> : <FiChevronRight className="w-4 h-4" />}
                      Escalation Notes
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-2">
                      <div className="p-3 rounded-md bg-muted/30 border border-border text-sm leading-relaxed">
                        {renderMarkdown(response.escalation_notes)}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </CardContent>
            </Card>

            {/* Action Bar */}
            <div className="flex flex-wrap gap-3">
              {approved ? (
                <Badge className="bg-green-700 text-white py-2 px-4 text-sm">
                  <FiCheck className="w-4 h-4 mr-1.5" />
                  Response Approved
                </Badge>
              ) : (
                <>
                  {!isSilenceStrategy && (
                    <Button onClick={handleApproveResponse} className="bg-accent text-accent-foreground hover:bg-accent/90">
                      Approve Response
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setEditableResponse(response?.draft_response ?? '')}>
                    Reset Edit
                  </Button>
                  <Button variant="outline" onClick={handleAdoptSilence} className="text-muted-foreground">
                    Adopt Silence
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  )
}
