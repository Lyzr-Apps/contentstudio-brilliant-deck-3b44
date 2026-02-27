'use client'

import React, { useState } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Skeleton } from '@/components/ui/skeleton'
import { FiChevronDown, FiChevronRight, FiClock, FiCopy, FiCheck } from 'react-icons/fi'
import { BsWhatsapp, BsFacebook } from 'react-icons/bs'

const CONTENT_AGENT_ID = '69a17462cd4048c3ee3ca47d'

const PILLARS = [
  { value: 'A', label: 'A - Economic Development' },
  { value: 'B', label: 'B - Infrastructure & Connectivity' },
  { value: 'C', label: 'C - Education & Skills' },
  { value: 'D', label: 'D - Healthcare Access' },
  { value: 'E', label: 'E - Cultural Heritage & Unity' },
  { value: 'F', label: 'F - Security & Governance' },
]

const OBJECTIVES = [
  { value: 'Engagement', label: 'Engagement' },
  { value: 'Narrative Control', label: 'Narrative Control' },
  { value: 'Mobilization', label: 'Mobilization' },
  { value: 'Rebuttal', label: 'Rebuttal' },
]

interface ContentDraft {
  id: string
  platform: string
  pillar: string
  tone_level: string
  objective: string
  post_text: string
  recommended_time: string
  strategic_reasoning: string
  hashtags: string
  call_to_action: string
  status: 'draft' | 'approved' | 'rejected'
  created_at: string
}

interface ContentStudioProps {
  onApprove: (draft: ContentDraft) => void
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

function getPillarColor(pillar: string): string {
  const letter = pillar?.charAt(0)?.toUpperCase() ?? ''
  switch (letter) {
    case 'A': return 'bg-[hsl(27,61%,35%)] text-white'
    case 'B': return 'bg-[hsl(36,60%,31%)] text-white'
    case 'C': return 'bg-[hsl(30,50%,40%)] text-white'
    case 'D': return 'bg-[hsl(20,45%,45%)] text-white'
    case 'E': return 'bg-[hsl(15,55%,38%)] text-white'
    case 'F': return 'bg-accent text-accent-foreground'
    default: return 'bg-muted text-muted-foreground'
  }
}

export default function ContentStudio({ onApprove, setActiveAgentId }: ContentStudioProps) {
  const [platform, setPlatform] = useState<string>('WhatsApp')
  const [pillar, setPillar] = useState<string>('')
  const [objective, setObjective] = useState<string>('Engagement')
  const [context, setContext] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState<ContentDraft | null>(null)
  const [editableText, setEditableText] = useState<string>('')
  const [reasoningOpen, setReasoningOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    if (!pillar) {
      setError('Please select a strategic pillar.')
      return
    }
    setLoading(true)
    setError(null)
    setDraft(null)
    setActiveAgentId(CONTENT_AGENT_ID)

    try {
      const pillarLabel = PILLARS.find(p => p.value === pillar)?.label ?? pillar
      const message = `Generate campaign content for: Platform: ${platform}, Pillar: ${pillarLabel}, Objective: ${objective}${context ? `, Context: ${context}` : ''}`
      const result = await callAIAgent(message, CONTENT_AGENT_ID)

      if (result?.success) {
        const data = result?.response?.result
        const newDraft: ContentDraft = {
          id: `draft-${Date.now()}`,
          platform: data?.platform ?? platform,
          pillar: data?.pillar ?? pillarLabel,
          tone_level: data?.tone_level ?? '',
          objective: data?.objective ?? objective,
          post_text: data?.post_text ?? '',
          recommended_time: data?.recommended_time ?? '',
          strategic_reasoning: data?.strategic_reasoning ?? '',
          hashtags: data?.hashtags ?? '',
          call_to_action: data?.call_to_action ?? '',
          status: 'draft',
          created_at: new Date().toISOString(),
        }
        setDraft(newDraft)
        setEditableText(newDraft.post_text)
      } else {
        setError(result?.error ?? 'Failed to generate content. Please try again.')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
      setActiveAgentId(null)
    }
  }

  const handleApprove = () => {
    if (!draft) return
    const approvedDraft: ContentDraft = { ...draft, post_text: editableText, status: 'approved' }
    onApprove(approvedDraft)
    setDraft(null)
    setEditableText('')
    setContext('')
  }

  const handleReject = () => {
    setDraft(null)
    setEditableText('')
    handleGenerate()
  }

  const handleCopy = () => {
    if (editableText) {
      navigator.clipboard.writeText(editableText).catch(() => {})
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Left Panel - Generation Controls */}
      <div className="w-full lg:w-[380px] flex-shrink-0">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-serif tracking-wide text-lg">Content Generator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Platform Toggle */}
            <div className="space-y-2">
              <Label className="text-sm font-sans text-muted-foreground">Platform</Label>
              <div className="flex gap-1 bg-muted rounded-lg p-1">
                {['WhatsApp', 'Facebook', 'Both'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPlatform(p)}
                    className={`flex-1 py-2 px-3 text-xs font-medium rounded-md transition-all duration-200 flex items-center justify-center gap-1.5 ${platform === p ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {p === 'WhatsApp' && <BsWhatsapp className="w-3.5 h-3.5" />}
                    {p === 'Facebook' && <BsFacebook className="w-3.5 h-3.5" />}
                    {p === 'Both' && <><BsWhatsapp className="w-3 h-3" /><BsFacebook className="w-3 h-3" /></>}
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Pillar Selector */}
            <div className="space-y-2">
              <Label className="text-sm font-sans text-muted-foreground">Strategic Pillar</Label>
              <Select value={pillar} onValueChange={setPillar}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="Select pillar..." />
                </SelectTrigger>
                <SelectContent>
                  {PILLARS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Objective */}
            <div className="space-y-2">
              <Label className="text-sm font-sans text-muted-foreground">Objective</Label>
              <div className="grid grid-cols-2 gap-2">
                {OBJECTIVES.map((obj) => (
                  <button
                    key={obj.value}
                    onClick={() => setObjective(obj.value)}
                    className={`py-2 px-3 text-xs font-medium rounded-md border transition-all duration-200 ${objective === obj.value ? 'border-accent bg-accent/20 text-accent-foreground' : 'border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground'}`}
                  >
                    {obj.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Context */}
            <div className="space-y-2">
              <Label className="text-sm font-sans text-muted-foreground">Context (optional)</Label>
              <Textarea
                placeholder="Add context, recent events, or specific messaging angles..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="bg-input border-border min-h-[100px] resize-none text-sm"
              />
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={loading || !pillar}
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-sans"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                  Generating...
                </span>
              ) : (
                'Generate Content'
              )}
            </Button>

            {error && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                {error}
                <button onClick={handleGenerate} className="block mt-1 text-xs underline hover:no-underline">Retry</button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - Generated Draft */}
      <div className="flex-1 min-w-0">
        {loading && (
          <Card className="bg-card border-border">
            <CardContent className="p-6 space-y-4">
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-32 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex gap-2 pt-4">
                <Skeleton className="h-10 w-40" />
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-40" />
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && !draft && (
          <Card className="bg-card border-border h-full flex items-center justify-center min-h-[400px]">
            <CardContent className="text-center p-8">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <FiClock className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-serif tracking-wide text-lg mb-2">Ready to Create</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                Configure your content parameters on the left and click Generate to create campaign content tailored to your strategy.
              </p>
            </CardContent>
          </Card>
        )}

        {!loading && draft && (
          <ScrollArea className="h-full">
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex flex-wrap gap-2 items-center">
                  <Badge className={getPillarColor(draft.pillar)}>
                    {draft.pillar}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    {(draft.platform ?? '').toLowerCase().includes('whatsapp') && <BsWhatsapp className="w-3 h-3" />}
                    {(draft.platform ?? '').toLowerCase().includes('facebook') && <BsFacebook className="w-3 h-3" />}
                    {(draft.platform ?? '').toLowerCase().includes('both') && <><BsWhatsapp className="w-3 h-3" /><BsFacebook className="w-3 h-3" /></>}
                    {draft.platform}
                  </Badge>
                  {draft.tone_level && (
                    <Badge variant="secondary">{draft.tone_level}</Badge>
                  )}
                  {draft.objective && (
                    <Badge variant="secondary">{draft.objective}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Post Text */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-sans text-muted-foreground">Post Text</Label>
                    <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 px-2 text-xs">
                      {copied ? <FiCheck className="w-3.5 h-3.5 mr-1" /> : <FiCopy className="w-3.5 h-3.5 mr-1" />}
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                  <Textarea
                    value={editableText}
                    onChange={(e) => setEditableText(e.target.value)}
                    className="bg-input border-border min-h-[160px] text-sm leading-relaxed"
                  />
                  <p className="text-xs text-muted-foreground text-right">{(editableText ?? '').length} characters</p>
                </div>

                {/* Recommended Time */}
                {draft.recommended_time && (
                  <div className="flex items-start gap-3 p-3 rounded-md bg-muted/50 border border-border">
                    <FiClock className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                    <div>
                      <Label className="text-xs font-sans text-muted-foreground">Recommended Time</Label>
                      <p className="text-sm mt-0.5">{draft.recommended_time}</p>
                    </div>
                  </div>
                )}

                {/* Call to Action */}
                {draft.call_to_action && (
                  <div className="space-y-1">
                    <Label className="text-sm font-sans text-muted-foreground">Call to Action</Label>
                    <div className="text-sm leading-relaxed">{renderMarkdown(draft.call_to_action)}</div>
                  </div>
                )}

                {/* Hashtags */}
                {draft.hashtags && (
                  <div className="space-y-1">
                    <Label className="text-sm font-sans text-muted-foreground">Hashtags</Label>
                    <p className="text-sm text-accent">{draft.hashtags}</p>
                  </div>
                )}

                {/* Strategic Reasoning */}
                {draft.strategic_reasoning && (
                  <Collapsible open={reasoningOpen} onOpenChange={setReasoningOpen}>
                    <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full">
                      {reasoningOpen ? <FiChevronDown className="w-4 h-4" /> : <FiChevronRight className="w-4 h-4" />}
                      Strategic Reasoning
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-2">
                      <div className="p-3 rounded-md bg-muted/30 border border-border text-sm leading-relaxed">
                        {renderMarkdown(draft.strategic_reasoning)}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                <Separator className="bg-border" />

                {/* Action Bar */}
                <div className="flex flex-wrap gap-3">
                  <Button onClick={handleApprove} className="bg-accent text-accent-foreground hover:bg-accent/90">
                    Approve & Schedule
                  </Button>
                  <Button variant="outline" onClick={() => setDraft({ ...draft })}>
                    Edit
                  </Button>
                  <Button variant="outline" onClick={handleReject} className="text-destructive border-destructive/30 hover:bg-destructive/10">
                    Reject & Regenerate
                  </Button>
                </div>
              </CardContent>
            </Card>
          </ScrollArea>
        )}
      </div>
    </div>
  )
}
