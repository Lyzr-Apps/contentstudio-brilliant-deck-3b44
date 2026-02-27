'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  FiHome,
  FiEdit3,
  FiShield,
  FiBarChart2,
  FiCalendar,
  FiBell,
  FiChevronLeft,
  FiChevronRight,
  FiPlus,
  FiClock,
  FiCheck,
  FiAlertTriangle,
  FiActivity,
  FiFileText,
  FiFilter,
  FiMenu,
} from 'react-icons/fi'
import { BsWhatsapp, BsFacebook } from 'react-icons/bs'
import ContentStudio from './sections/ContentStudio'
import RapidResponse from './sections/RapidResponse'
import StrategyAnalytics from './sections/StrategyAnalytics'

// ─── ErrorBoundary ───────────────────────────────────────────────────

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: '' })}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ─── Constants & Types ───────────────────────────────────────────────

const AGENT_IDS = {
  content: '69a17462cd4048c3ee3ca47d',
  crisis: '69a1747cf03a54d775b55b1e',
  strategy: '69a17462cd4048c3ee3ca47f',
}

const AGENTS_INFO = [
  { id: AGENT_IDS.content, name: 'Content Generation', purpose: 'Create campaign posts' },
  { id: AGENT_IDS.crisis, name: 'Crisis Response', purpose: 'Analyze attacks & draft responses' },
  { id: AGENT_IDS.strategy, name: 'Strategy Advisor', purpose: 'Performance analysis & recommendations' },
]

const PILLARS: Record<string, { label: string; color: string }> = {
  A: { label: 'Economic Development', color: 'bg-[hsl(27,61%,35%)]' },
  B: { label: 'Infrastructure & Connectivity', color: 'bg-[hsl(36,60%,31%)]' },
  C: { label: 'Education & Skills', color: 'bg-[hsl(30,50%,40%)]' },
  D: { label: 'Healthcare Access', color: 'bg-[hsl(20,45%,45%)]' },
  E: { label: 'Cultural Heritage & Unity', color: 'bg-[hsl(15,55%,38%)]' },
  F: { label: 'Security & Governance', color: 'bg-accent' },
}

type Screen = 'dashboard' | 'content' | 'rapid' | 'strategy' | 'calendar'

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

interface CalendarEvent {
  id: string
  draft: ContentDraft
  scheduled_date: string
  approved_at: string
}

// ─── Helpers ─────────────────────────────────────────────────────────

function getPillarLetter(pillarStr: string): string {
  if (!pillarStr) return ''
  const first = pillarStr.charAt(0).toUpperCase()
  if (PILLARS[first]) return first
  return ''
}

function getPillarColor(pillarStr: string): string {
  const letter = getPillarLetter(pillarStr)
  return PILLARS[letter]?.color ?? 'bg-muted'
}

function getPillarLabel(pillarStr: string): string {
  const letter = getPillarLetter(pillarStr)
  return PILLARS[letter]?.label ?? pillarStr
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return dateStr
  }
}

function formatTime(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

// ─── Sample Data ────────────────────────────────────────────────────

const SAMPLE_DRAFTS: ContentDraft[] = [
  {
    id: 'sample-1',
    platform: 'WhatsApp',
    pillar: 'A - Economic Development',
    tone_level: 'Level 2 - Conversational',
    objective: 'Engagement',
    post_text: 'Our district has seen 3 new industries open this quarter alone. Real progress means real jobs for our families.',
    recommended_time: 'Tuesday 9:00 AM - Peak engagement for WhatsApp status updates',
    strategic_reasoning: 'Economic messaging resonates strongly with working-age demographics.',
    hashtags: '',
    call_to_action: 'Share this with someone looking for employment opportunities.',
    status: 'draft',
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: 'sample-2',
    platform: 'Facebook',
    pillar: 'C - Education & Skills',
    tone_level: 'Level 3 - Inspirational',
    objective: 'Mobilization',
    post_text: 'Scholarships awarded: 150+. Skills programs launched: 12. Youth empowered: countless. Education transforms communities.',
    recommended_time: 'Wednesday 7:00 PM - High Facebook engagement window',
    strategic_reasoning: 'Education stats create shareable content with visual impact.',
    hashtags: '#EducationFirst #SkillsForYouth #CommunityGrowth',
    call_to_action: 'Tag a student who deserves to know about these opportunities.',
    status: 'approved',
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'sample-3',
    platform: 'Both',
    pillar: 'E - Cultural Heritage & Unity',
    tone_level: 'Level 2 - Conversational',
    objective: 'Engagement',
    post_text: 'Our cultural festival brought together 10,000+ people from all backgrounds. Unity is not just a word - it is our strength.',
    recommended_time: 'Saturday 10:00 AM - Weekend cultural content performs best',
    strategic_reasoning: 'Cultural content drives emotional engagement and sharing.',
    hashtags: '#UnityInDiversity #CulturalHeritage',
    call_to_action: 'Share your favorite moment from the festival.',
    status: 'draft',
    created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
  },
]

const SAMPLE_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: 'evt-1',
    draft: SAMPLE_DRAFTS[1],
    scheduled_date: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    approved_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
  },
  {
    id: 'evt-2',
    draft: {
      id: 'sample-4',
      platform: 'Facebook',
      pillar: 'B - Infrastructure & Connectivity',
      tone_level: 'Level 2 - Conversational',
      objective: 'Narrative Control',
      post_text: 'New road connecting 5 villages completed ahead of schedule. Infrastructure that connects people, not divides them.',
      recommended_time: 'Thursday 11:00 AM',
      strategic_reasoning: 'Infrastructure achievements counter opposition narratives.',
      hashtags: '#BuildingConnections #Infrastructure',
      call_to_action: 'Which area needs better connectivity? Tell us below.',
      status: 'approved',
      created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    },
    scheduled_date: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    approved_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'evt-3',
    draft: {
      id: 'sample-5',
      platform: 'WhatsApp',
      pillar: 'D - Healthcare Access',
      tone_level: 'Level 3 - Inspirational',
      objective: 'Engagement',
      post_text: 'Free health camp this Sunday at the community center. Bring your family. 15 specialist doctors available.',
      recommended_time: 'Friday 6:00 PM',
      strategic_reasoning: 'Healthcare outreach builds grassroots support.',
      hashtags: '',
      call_to_action: 'Forward to family and friends who need medical checkups.',
      status: 'approved',
      created_at: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    },
    scheduled_date: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
    approved_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
  },
]

// ─── Sidebar Component ──────────────────────────────────────────────

function Sidebar({
  active,
  onNavigate,
  collapsed,
  onToggle,
}: {
  active: Screen
  onNavigate: (s: Screen) => void
  collapsed: boolean
  onToggle: () => void
}) {
  const navItems: { key: Screen; icon: React.ReactNode; label: string }[] = [
    { key: 'dashboard', icon: <FiHome className="w-5 h-5" />, label: 'Dashboard' },
    { key: 'content', icon: <FiEdit3 className="w-5 h-5" />, label: 'Content Studio' },
    { key: 'rapid', icon: <FiShield className="w-5 h-5" />, label: 'Rapid Response' },
    { key: 'strategy', icon: <FiBarChart2 className="w-5 h-5" />, label: 'Strategy & Analytics' },
    { key: 'calendar', icon: <FiCalendar className="w-5 h-5" />, label: 'Campaign Calendar' },
  ]

  return (
    <div
      className={`h-screen flex flex-col bg-[hsl(var(--sidebar-background))] border-r border-[hsl(var(--sidebar-border))] transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'}`}
    >
      {/* Logo */}
      <div className="p-4 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-accent flex items-center justify-center">
              <span className="text-accent-foreground font-serif font-bold text-sm">L27</span>
            </div>
            <span className="font-serif font-semibold tracking-wide text-sm text-[hsl(var(--sidebar-foreground))]">DCA Engine</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-md hover:bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-foreground))] transition-colors"
        >
          {collapsed ? <FiChevronRight className="w-4 h-4" /> : <FiChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <Separator className="bg-[hsl(var(--sidebar-border))]" />

      {/* Nav Items */}
      <nav className="flex-1 py-3 px-2 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-sans transition-all duration-200 ${active === item.key ? 'bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))]' : 'text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))]'}`}
            title={collapsed ? item.label : undefined}
          >
            {item.icon}
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      <Separator className="bg-[hsl(var(--sidebar-border))]" />

      {/* Agent Status */}
      {!collapsed && (
        <div className="p-3">
          <p className="text-xs text-muted-foreground mb-2 font-sans">Agents</p>
          {AGENTS_INFO.map((agent) => (
            <div key={agent.id} className="flex items-center gap-2 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
              <span className="text-xs text-[hsl(var(--sidebar-foreground))] truncate">{agent.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Top Bar ─────────────────────────────────────────────────────────

function TopBar({
  screen,
  sampleData,
  onToggleSample,
  activeAgentId,
  onMobileMenu,
}: {
  screen: Screen
  sampleData: boolean
  onToggleSample: (v: boolean) => void
  activeAgentId: string | null
  onMobileMenu: () => void
}) {
  const titles: Record<Screen, string> = {
    dashboard: 'Campaign Dashboard',
    content: 'Content Studio',
    rapid: 'Rapid Response',
    strategy: 'Strategy & Analytics',
    calendar: 'Campaign Calendar',
  }

  const activeAgent = AGENTS_INFO.find(a => a.id === activeAgentId)

  return (
    <div className="h-14 border-b border-border bg-card flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
      <div className="flex items-center gap-3">
        <button onClick={onMobileMenu} className="lg:hidden p-1.5 rounded-md hover:bg-muted transition-colors">
          <FiMenu className="w-5 h-5" />
        </button>
        <h1 className="font-serif tracking-wide text-lg">{titles[screen]}</h1>
        <Badge variant="outline" className="hidden sm:flex items-center gap-1 text-xs">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
          Active
        </Badge>
        {activeAgent && (
          <Badge variant="secondary" className="text-xs flex items-center gap-1 animate-pulse">
            <FiActivity className="w-3 h-3" />
            {activeAgent.name}
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="sample-toggle" className="text-xs text-muted-foreground font-sans cursor-pointer">Sample Data</Label>
          <Switch id="sample-toggle" checked={sampleData} onCheckedChange={onToggleSample} />
        </div>
        <button className="p-2 rounded-md hover:bg-muted transition-colors relative">
          <FiBell className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  )
}

// ─── Dashboard Screen ───────────────────────────────────────────────

function DashboardScreen({
  drafts,
  calendarEvents,
  onNavigate,
  sampleData,
}: {
  drafts: ContentDraft[]
  calendarEvents: CalendarEvent[]
  onNavigate: (s: Screen) => void
  sampleData: boolean
}) {
  const pendingCount = drafts.filter(d => d.status === 'draft').length
  const approvedCount = drafts.filter(d => d.status === 'approved').length
  const pillarCounts: Record<string, number> = {}
  drafts.forEach(d => {
    const letter = getPillarLetter(d.pillar)
    if (letter) pillarCounts[letter] = (pillarCounts[letter] ?? 0) + 1
  })
  const threatAlerts = 0

  const stats = [
    { label: 'Drafts Pending', value: pendingCount, icon: <FiFileText className="w-5 h-5" />, trend: sampleData ? '+2 today' : '' },
    { label: 'Approved This Week', value: approvedCount, icon: <FiCheck className="w-5 h-5" />, trend: sampleData ? '+5 vs last week' : '' },
    { label: 'Posts by Pillar', value: Object.keys(pillarCounts).length, icon: <FiBarChart2 className="w-5 h-5" />, trend: sampleData ? '6 active pillars' : '' },
    { label: 'Threat Alerts', value: threatAlerts, icon: <FiAlertTriangle className="w-5 h-5" />, trend: sampleData ? 'None active' : '' },
  ]

  // Generate week days
  const today = new Date()
  const weekDays: { date: Date; label: string; events: CalendarEvent[] }[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const dayStr = d.toDateString()
    const dayEvents = calendarEvents.filter(evt => {
      try {
        return new Date(evt.scheduled_date).toDateString() === dayStr
      } catch {
        return false
      }
    })
    weekDays.push({
      date: d,
      label: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
      events: dayEvents,
    })
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-6 pb-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, idx) => (
            <Card key={idx} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-muted-foreground">{stat.icon}</span>
                </div>
                <div className="text-2xl font-serif font-bold tracking-wide">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1 font-sans">{stat.label}</p>
                {stat.trend && <p className="text-xs text-accent mt-1">{stat.trend}</p>}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Drafts */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="font-serif tracking-wide text-base">Recent Drafts</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => onNavigate('content')} className="text-xs text-accent">
                  View all
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {drafts.length === 0 ? (
                <div className="text-center py-8">
                  <FiEdit3 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No drafts yet. Create your first content.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {drafts.slice(0, 5).map((draft) => (
                    <div key={draft.id} className="p-3 rounded-md bg-muted/30 border border-border hover:border-muted-foreground/30 transition-colors">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className={`w-2 h-2 rounded-full ${getPillarColor(draft.pillar)}`} />
                        <Badge variant="outline" className="text-xs py-0 px-1.5">
                          {(draft.platform ?? '').toLowerCase().includes('whatsapp') ? <BsWhatsapp className="w-3 h-3" /> : <BsFacebook className="w-3 h-3" />}
                        </Badge>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {draft.status === 'approved' ? (
                            <Badge className="bg-green-700/20 text-green-400 border-green-700/30 text-xs py-0">Approved</Badge>
                          ) : draft.status === 'rejected' ? (
                            <Badge className="bg-red-700/20 text-red-400 border-red-700/30 text-xs py-0">Rejected</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs py-0">Draft</Badge>
                          )}
                        </span>
                      </div>
                      <p className="text-sm line-clamp-2 leading-relaxed">{draft.post_text}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatDate(draft.created_at)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Week Calendar */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="font-serif tracking-wide text-base">Upcoming Week</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => onNavigate('calendar')} className="text-xs text-accent">
                  Full calendar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1">
                {weekDays.map((day, idx) => (
                  <div
                    key={idx}
                    className={`text-center p-2 rounded-md ${idx === 0 ? 'bg-accent/10 border border-accent/30' : 'bg-muted/20'}`}
                  >
                    <p className="text-xs text-muted-foreground font-sans">{day.label.split(' ')[0]}</p>
                    <p className="text-sm font-medium mt-0.5">{day.label.split(' ')[1]}</p>
                    <div className="flex gap-0.5 justify-center mt-1.5 flex-wrap">
                      {day.events.map((evt) => (
                        <div
                          key={evt.id}
                          className={`w-2 h-2 rounded-full ${getPillarColor(evt.draft.pillar)}`}
                          title={evt.draft.pillar}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3">
          <Button onClick={() => onNavigate('content')} className="bg-accent text-accent-foreground hover:bg-accent/90 flex items-center gap-2">
            <FiPlus className="w-4 h-4" />
            New Content
          </Button>
          <Button onClick={() => onNavigate('rapid')} variant="outline" className="flex items-center gap-2">
            <FiShield className="w-4 h-4" />
            Rapid Response
          </Button>
        </div>
      </div>
    </ScrollArea>
  )
}

// ─── Campaign Calendar Screen ───────────────────────────────────────

function CalendarScreen({
  calendarEvents,
  sampleData,
}: {
  calendarEvents: CalendarEvent[]
  sampleData: boolean
}) {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week')
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [filterPlatform, setFilterPlatform] = useState<string>('all')
  const [filterPillar, setFilterPillar] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const filteredEvents = calendarEvents.filter(evt => {
    if (filterPlatform !== 'all' && !(evt.draft.platform ?? '').toLowerCase().includes(filterPlatform.toLowerCase())) return false
    if (filterPillar !== 'all' && getPillarLetter(evt.draft.pillar) !== filterPillar) return false
    if (filterStatus !== 'all' && evt.draft.status !== filterStatus) return false
    return true
  })

  // Generate days for the view
  const today = new Date()
  const daysCount = viewMode === 'week' ? 7 : 28
  const days: { date: Date; events: CalendarEvent[] }[] = []
  for (let i = 0; i < daysCount; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const dayStr = d.toDateString()
    const dayEvents = filteredEvents.filter(evt => {
      try {
        return new Date(evt.scheduled_date).toDateString() === dayStr
      } catch {
        return false
      }
    })
    days.push({ date: d, events: dayEvents })
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 pb-6">
        {/* Controls */}
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex gap-2">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'week' | 'month')}>
              <TabsList className="h-9">
                <TabsTrigger value="week" className="text-xs px-3">Week</TabsTrigger>
                <TabsTrigger value="month" className="text-xs px-3">Month</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <FiFilter className="w-4 h-4 text-muted-foreground" />
            <Select value={filterPlatform} onValueChange={setFilterPlatform}>
              <SelectTrigger className="w-[120px] h-8 text-xs bg-input border-border">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPillar} onValueChange={setFilterPillar}>
              <SelectTrigger className="w-[100px] h-8 text-xs bg-input border-border">
                <SelectValue placeholder="Pillar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Pillars</SelectItem>
                {Object.entries(PILLARS).map(([letter, info]) => (
                  <SelectItem key={letter} value={letter}>{letter} - {info.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[110px] h-8 text-xs bg-input border-border">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="approved">Scheduled</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Calendar Grid */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            {filteredEvents.length === 0 && !sampleData ? (
              <div className="text-center py-12">
                <FiCalendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-serif tracking-wide text-base mb-1">No Scheduled Content</h3>
                <p className="text-sm text-muted-foreground">Approved drafts from Content Studio will appear here.</p>
              </div>
            ) : (
              <div className={`grid gap-2 ${viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-7'}`}>
                {/* Day Headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="text-xs text-muted-foreground text-center py-1 font-sans">{d}</div>
                ))}
                {/* Day Cells */}
                {days.map((day, idx) => {
                  const isToday = day.date.toDateString() === today.toDateString()
                  return (
                    <div
                      key={idx}
                      className={`min-h-[80px] p-1.5 rounded-md border transition-colors ${isToday ? 'border-accent/50 bg-accent/5' : 'border-border bg-muted/10'}`}
                    >
                      <p className={`text-xs font-sans mb-1 ${isToday ? 'text-accent font-medium' : 'text-muted-foreground'}`}>
                        {day.date.getDate()}
                      </p>
                      {day.events.map((evt) => (
                        <button
                          key={evt.id}
                          onClick={() => setSelectedEvent(evt)}
                          className={`w-full text-left p-1 rounded text-xs mb-0.5 truncate border-l-2 transition-colors hover:bg-muted/50 ${getPillarLetter(evt.draft.pillar) === 'A' ? 'border-l-[hsl(27,61%,35%)]' : getPillarLetter(evt.draft.pillar) === 'B' ? 'border-l-[hsl(36,60%,31%)]' : getPillarLetter(evt.draft.pillar) === 'C' ? 'border-l-[hsl(30,50%,40%)]' : getPillarLetter(evt.draft.pillar) === 'D' ? 'border-l-[hsl(20,45%,45%)]' : getPillarLetter(evt.draft.pillar) === 'E' ? 'border-l-[hsl(15,55%,38%)]' : 'border-l-accent'}`}
                        >
                          <span className="flex items-center gap-1">
                            {(evt.draft.platform ?? '').toLowerCase().includes('whatsapp') ? <BsWhatsapp className="w-2.5 h-2.5 flex-shrink-0" /> : <BsFacebook className="w-2.5 h-2.5 flex-shrink-0" />}
                            <span className="truncate">{(evt.draft.post_text ?? '').slice(0, 25)}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Event List */}
        {filteredEvents.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="font-serif tracking-wide text-base">Scheduled Posts ({filteredEvents.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredEvents.map((evt) => (
                  <button
                    key={evt.id}
                    onClick={() => setSelectedEvent(evt)}
                    className="w-full text-left p-3 rounded-md bg-muted/30 border border-border hover:border-muted-foreground/30 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${getPillarColor(evt.draft.pillar)}`} />
                      <Badge variant="outline" className="text-xs py-0 px-1.5">
                        {(evt.draft.platform ?? '').toLowerCase().includes('whatsapp') ? <BsWhatsapp className="w-3 h-3" /> : <BsFacebook className="w-3 h-3" />}
                      </Badge>
                      <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                        <FiClock className="w-3 h-3" />
                        {formatDate(evt.scheduled_date)} {formatTime(evt.scheduled_date)}
                      </span>
                    </div>
                    <p className="text-sm line-clamp-1">{evt.draft.post_text}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Event Detail Modal */}
        <Dialog open={!!selectedEvent} onOpenChange={(open) => { if (!open) setSelectedEvent(null) }}>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-serif tracking-wide">Post Details</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Scheduled content details and metadata
              </DialogDescription>
            </DialogHeader>
            {selectedEvent && (
              <div className="space-y-4 mt-2">
                <div className="flex flex-wrap gap-2">
                  <Badge className={`${getPillarColor(selectedEvent.draft.pillar)} text-white`}>
                    {selectedEvent.draft.pillar}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    {(selectedEvent.draft.platform ?? '').toLowerCase().includes('whatsapp') ? <BsWhatsapp className="w-3 h-3" /> : <BsFacebook className="w-3 h-3" />}
                    {selectedEvent.draft.platform}
                  </Badge>
                  {selectedEvent.draft.objective && (
                    <Badge variant="secondary">{selectedEvent.draft.objective}</Badge>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Post Text</Label>
                  <p className="text-sm leading-relaxed mt-1">{selectedEvent.draft.post_text}</p>
                </div>
                {selectedEvent.draft.call_to_action && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Call to Action</Label>
                    <p className="text-sm mt-1">{selectedEvent.draft.call_to_action}</p>
                  </div>
                )}
                {selectedEvent.draft.hashtags && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Hashtags</Label>
                    <p className="text-sm text-accent mt-1">{selectedEvent.draft.hashtags}</p>
                  </div>
                )}
                <Separator />
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground">Scheduled</span>
                    <p className="mt-0.5">{formatDate(selectedEvent.scheduled_date)} {formatTime(selectedEvent.scheduled_date)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Approved</span>
                    <p className="mt-0.5">{formatDate(selectedEvent.approved_at)}</p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ScrollArea>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────

export default function Page() {
  const [screen, setScreen] = useState<Screen>('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sampleData, setSampleData] = useState(false)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)

  // Data state
  const [drafts, setDrafts] = useState<ContentDraft[]>([])
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedDrafts = localStorage.getItem('l27-dca-drafts')
      if (savedDrafts) {
        const parsed = JSON.parse(savedDrafts)
        if (Array.isArray(parsed)) setDrafts(parsed)
      }
      const savedEvents = localStorage.getItem('l27-dca-calendar')
      if (savedEvents) {
        const parsed = JSON.parse(savedEvents)
        if (Array.isArray(parsed)) setCalendarEvents(parsed)
      }
    } catch {
      // Ignore parse errors
    }
  }, [])

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('l27-dca-drafts', JSON.stringify(drafts))
    } catch {
      // Ignore
    }
  }, [drafts])

  useEffect(() => {
    try {
      localStorage.setItem('l27-dca-calendar', JSON.stringify(calendarEvents))
    } catch {
      // Ignore
    }
  }, [calendarEvents])

  // Computed data based on sample toggle
  const displayDrafts = sampleData ? [...SAMPLE_DRAFTS, ...drafts] : drafts
  const displayEvents = sampleData ? [...SAMPLE_CALENDAR_EVENTS, ...calendarEvents] : calendarEvents

  // Handle draft approval from Content Studio
  const handleApproveDraft = useCallback((draft: ContentDraft) => {
    const approvedDraft = { ...draft, status: 'approved' as const }
    setDrafts(prev => [approvedDraft, ...prev])

    // Schedule for next available slot
    const scheduledDate = new Date()
    scheduledDate.setDate(scheduledDate.getDate() + 1)
    scheduledDate.setHours(9, 0, 0, 0)

    const event: CalendarEvent = {
      id: `evt-${Date.now()}`,
      draft: approvedDraft,
      scheduled_date: scheduledDate.toISOString(),
      approved_at: new Date().toISOString(),
    }
    setCalendarEvents(prev => [event, ...prev])
  }, [])

  const handleNavigate = useCallback((s: Screen) => {
    setScreen(s)
    setMobileMenuOpen(false)
  }, [])

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-foreground flex">
        {/* Mobile sidebar overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`fixed lg:relative z-50 lg:z-auto transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <Sidebar
            active={screen}
            onNavigate={handleNavigate}
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(prev => !prev)}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 h-screen">
          <TopBar
            screen={screen}
            sampleData={sampleData}
            onToggleSample={setSampleData}
            activeAgentId={activeAgentId}
            onMobileMenu={() => setMobileMenuOpen(prev => !prev)}
          />

          <main className="flex-1 overflow-hidden p-4 lg:p-6">
            {screen === 'dashboard' && (
              <DashboardScreen
                drafts={displayDrafts}
                calendarEvents={displayEvents}
                onNavigate={handleNavigate}
                sampleData={sampleData}
              />
            )}

            {screen === 'content' && (
              <ContentStudio
                onApprove={handleApproveDraft}
                setActiveAgentId={setActiveAgentId}
              />
            )}

            {screen === 'rapid' && (
              <RapidResponse
                setActiveAgentId={setActiveAgentId}
              />
            )}

            {screen === 'strategy' && (
              <StrategyAnalytics
                setActiveAgentId={setActiveAgentId}
              />
            )}

            {screen === 'calendar' && (
              <CalendarScreen
                calendarEvents={displayEvents}
                sampleData={sampleData}
              />
            )}
          </main>
        </div>
      </div>
    </ErrorBoundary>
  )
}
