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
import { Checkbox } from '@/components/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { FiChevronDown, FiChevronRight, FiBarChart2, FiAlertTriangle, FiTarget, FiTrendingUp } from 'react-icons/fi'

const STRATEGY_AGENT_ID = '69a17462cd4048c3ee3ca47f'

interface StrategyData {
  pillar_performance: string
  top_performing_content: string
  content_gaps: string
  timing_recommendations: string
  messaging_pivots: string
  competitor_insights: string
  weekly_priorities: string
  risk_alerts: string
}

interface ActionItem {
  id: string
  text: string
  applied: boolean
}

interface StrategyAnalyticsProps {
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

const PILLAR_LABELS: Record<string, string> = {
  A: 'Economic Development',
  B: 'Infrastructure & Connectivity',
  C: 'Education & Skills',
  D: 'Healthcare Access',
  E: 'Cultural Heritage & Unity',
  F: 'Security & Governance',
}

function getPillarBgColor(letter: string): string {
  switch (letter) {
    case 'A': return 'bg-[hsl(27,61%,35%)]'
    case 'B': return 'bg-[hsl(36,60%,31%)]'
    case 'C': return 'bg-[hsl(30,50%,40%)]'
    case 'D': return 'bg-[hsl(20,45%,45%)]'
    case 'E': return 'bg-[hsl(15,55%,38%)]'
    case 'F': return 'bg-accent'
    default: return 'bg-muted'
  }
}

export default function StrategyAnalytics({ setActiveAgentId }: StrategyAnalyticsProps) {
  const [inputData, setInputData] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [strategy, setStrategy] = useState<StrategyData | null>(null)
  const [actionItems, setActionItems] = useState<ActionItem[]>([])
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    pillar_performance: true,
    top_performing_content: true,
    content_gaps: true,
    timing_recommendations: false,
    messaging_pivots: false,
    competitor_insights: false,
    weekly_priorities: true,
    risk_alerts: true,
  })

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleAnalyze = async () => {
    if (!inputData.trim()) {
      setError('Please provide engagement data or trends to analyze.')
      return
    }
    setLoading(true)
    setError(null)
    setStrategy(null)
    setActionItems([])
    setActiveAgentId(STRATEGY_AGENT_ID)

    try {
      const result = await callAIAgent(
        `Analyze campaign performance: ${inputData}`,
        STRATEGY_AGENT_ID
      )

      if (result?.success) {
        const data = result?.response?.result
        const strategyData: StrategyData = {
          pillar_performance: data?.pillar_performance ?? '',
          top_performing_content: data?.top_performing_content ?? '',
          content_gaps: data?.content_gaps ?? '',
          timing_recommendations: data?.timing_recommendations ?? '',
          messaging_pivots: data?.messaging_pivots ?? '',
          competitor_insights: data?.competitor_insights ?? '',
          weekly_priorities: data?.weekly_priorities ?? '',
          risk_alerts: data?.risk_alerts ?? '',
        }
        setStrategy(strategyData)

        // Extract action items from weekly_priorities
        if (strategyData.weekly_priorities) {
          const lines = strategyData.weekly_priorities.split('\n').filter(l => l.trim().startsWith('-') || l.trim().startsWith('*') || /^\d+\./.test(l.trim()))
          const items: ActionItem[] = lines.map((line, idx) => ({
            id: `action-${idx}`,
            text: line.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, '').trim(),
            applied: false,
          }))
          if (items.length > 0) {
            setActionItems(items)
          }
        }
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

  const toggleActionItem = (id: string) => {
    setActionItems(prev => prev.map(item =>
      item.id === id ? { ...item, applied: !item.applied } : item
    ))
  }

  const sections = [
    { key: 'pillar_performance', label: 'Pillar Performance', icon: <FiBarChart2 className="w-4 h-4" />, value: strategy?.pillar_performance },
    { key: 'top_performing_content', label: 'Top Performing Content', icon: <FiTrendingUp className="w-4 h-4" />, value: strategy?.top_performing_content },
    { key: 'content_gaps', label: 'Content Gaps', icon: <FiTarget className="w-4 h-4" />, value: strategy?.content_gaps, highlight: true },
    { key: 'timing_recommendations', label: 'Timing Recommendations', icon: null, value: strategy?.timing_recommendations },
    { key: 'messaging_pivots', label: 'Messaging Pivots', icon: null, value: strategy?.messaging_pivots },
    { key: 'competitor_insights', label: 'Competitor Insights', icon: null, value: strategy?.competitor_insights },
    { key: 'weekly_priorities', label: 'Weekly Priorities', icon: null, value: strategy?.weekly_priorities },
    { key: 'risk_alerts', label: 'Risk Alerts', icon: <FiAlertTriangle className="w-4 h-4" />, value: strategy?.risk_alerts, isRisk: true },
  ]

  return (
    <ScrollArea className="h-full">
      <div className="space-y-6 pb-6">
        {/* Input Area */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="font-serif tracking-wide text-lg flex items-center gap-2">
              <FiBarChart2 className="w-5 h-5 text-accent" />
              Strategy Advisor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-sans text-muted-foreground">
                Engagement data, trends, or campaign metrics
              </Label>
              <Textarea
                placeholder="Paste engagement metrics, audience feedback, recent polling data, social media analytics, or describe current campaign performance trends..."
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                className="bg-input border-border min-h-[120px] resize-none text-sm leading-relaxed"
              />
            </div>
            <Button
              onClick={handleAnalyze}
              disabled={loading || !inputData.trim()}
              className="bg-accent text-accent-foreground hover:bg-accent/90 font-sans"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                  Analyzing...
                </span>
              ) : (
                'Analyze Performance'
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
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Strategy Briefing */}
        {!loading && strategy && (
          <div className="space-y-4">
            {/* Pillar Performance Visual */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="font-serif tracking-wide text-base">Pillar Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(PILLAR_LABELS).map(([letter, name]) => (
                    <div key={letter} className="flex items-center gap-2 p-2.5 rounded-md bg-muted/30 border border-border">
                      <div className={`w-3 h-3 rounded-full ${getPillarBgColor(letter)} flex-shrink-0`} />
                      <div>
                        <span className="text-xs font-medium">{letter}</span>
                        <span className="text-xs text-muted-foreground ml-1">{name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Collapsible Sections */}
            <Card className="bg-card border-border">
              <CardContent className="p-5 space-y-1">
                {sections.map((section) => {
                  if (!section.value) return null
                  const isOpen = openSections[section.key] ?? false
                  return (
                    <Collapsible key={section.key} open={isOpen} onOpenChange={() => toggleSection(section.key)}>
                      <CollapsibleTrigger className={`flex items-center gap-2 text-sm w-full py-2.5 px-2 rounded-md transition-colors ${section.isRisk ? 'text-destructive hover:text-destructive/80' : section.highlight ? 'text-accent hover:text-accent/80' : 'text-foreground hover:text-muted-foreground'}`}>
                        {isOpen ? <FiChevronDown className="w-4 h-4 flex-shrink-0" /> : <FiChevronRight className="w-4 h-4 flex-shrink-0" />}
                        {section.icon && <span className="flex-shrink-0">{section.icon}</span>}
                        <span className="font-medium">{section.label}</span>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-1 pb-3 pl-8">
                        <div className={`p-3 rounded-md border text-sm leading-relaxed ${section.isRisk ? 'bg-destructive/5 border-destructive/20' : section.highlight ? 'bg-accent/5 border-accent/20' : 'bg-muted/30 border-border'}`}>
                          {renderMarkdown(section.value)}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )
                })}
              </CardContent>
            </Card>

            {/* Action Items */}
            {actionItems.length > 0 && (
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-serif tracking-wide text-base">Action Items</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {actionItems.filter(a => a.applied).length}/{actionItems.length} Applied
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {actionItems.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-start gap-3 p-3 rounded-md border transition-all duration-200 ${item.applied ? 'bg-accent/5 border-accent/30' : 'bg-muted/20 border-border hover:border-muted-foreground/30'}`}
                      >
                        <Checkbox
                          checked={item.applied}
                          onCheckedChange={() => toggleActionItem(item.id)}
                          className="mt-0.5"
                        />
                        <span className={`text-sm leading-relaxed ${item.applied ? 'line-through text-muted-foreground' : ''}`}>
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </ScrollArea>
  )
}
