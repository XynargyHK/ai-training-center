'use client'

import { useState, useEffect } from 'react'
import { Users, Upload, Mail, Calendar, TrendingUp, Filter, Search, Plus, Edit, Trash2, Eye, Send } from 'lucide-react'

interface Lead {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  title?: string
  company?: string
  company_size?: string
  industry?: string
  location?: string
  linkedin_url?: string
  lead_score: number
  lead_status: 'new' | 'contacted' | 'engaged' | 'qualified' | 'scheduled' | 'converted' | 'lost'
  lead_source: string
  tags?: string[]
  notes?: string
  last_contacted_at?: Date
  next_follow_up_at?: Date
  created_at: Date
}

interface EmailSequence {
  id: string
  name: string
  description: string
  is_active: boolean
  delay_days: number
  max_emails: number
}

const LeadManagement = () => {
  const [activeView, setActiveView] = useState<'leads' | 'sequences' | 'analytics'>('leads')
  const [leads, setLeads] = useState<Lead[]>([])
  const [sequences, setSequences] = useState<EmailSequence[]>([])
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showLeadModal, setShowLeadModal] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)

  useEffect(() => {
    loadLeads()
    loadSequences()
  }, [])

  const loadLeads = async () => {
    setIsLoading(true)
    try {
      // Demo data (session-only, resets on page refresh)
        const demoLeads: Lead[] = [
          {
            id: '1',
            first_name: 'Sarah',
            last_name: 'Johnson',
            email: 'sarah.johnson@beautyco.com',
            phone: '+1 555-0123',
            title: 'Marketing Director',
            company: 'BeautyCo',
            company_size: '50-200',
            industry: 'Cosmetics',
            location: 'Los Angeles, CA',
            linkedin_url: 'https://linkedin.com/in/sarahjohnson',
            lead_score: 85,
            lead_status: 'engaged',
            lead_source: 'linkedin',
            tags: ['hot-lead', 'decision-maker'],
            notes: 'Very interested in AI coaching features',
            last_contacted_at: new Date('2025-01-02'),
            next_follow_up_at: new Date('2025-01-05'),
            created_at: new Date('2025-01-01')
          },
          {
            id: '2',
            first_name: 'Michael',
            last_name: 'Chen',
            email: 'mchen@skinhealth.com',
            title: 'CEO',
            company: 'SkinHealth Solutions',
            company_size: '10-50',
            industry: 'Healthcare',
            location: 'San Francisco, CA',
            linkedin_url: 'https://linkedin.com/in/michaelchen',
            lead_score: 92,
            lead_status: 'qualified',
            lead_source: 'linkedin',
            tags: ['founder', 'high-priority'],
            next_follow_up_at: new Date('2025-01-04'),
            created_at: new Date('2025-01-01')
          }
        ]
        setLeads(demoLeads)
        // Demo data is session-only (no persistence)
      }
    } catch (error) {
      console.error('Error loading leads:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadSequences = async () => {
    try {
      // Demo sequences (session-only, resets on page refresh)
      const demoSequences: EmailSequence[] = [
        {
          id: '1',
          name: 'AI assistant Intro Sequence',
          description: 'Initial outreach for customer service professionals',
          is_active: true,
          delay_days: 3,
          max_emails: 5
        }
      ]
      setSequences(demoSequences)
      // Demo data is session-only (no persistence)
    } catch (error) {
      console.error('Error loading sequences:', error)
    }
  }

  const saveLeads = () => {
    // Demo data is session-only (no persistence needed)
  }

  const handleCSVImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const rows = text.split('\n')
      const headers = rows[0].split(',').map(h => h.trim())

      const newLeads: Lead[] = []
      for (let i = 1; i < rows.length; i++) {
        const values = rows[i].split(',').map(v => v.trim())
        if (values.length < 2) continue

        const lead: Lead = {
          id: `lead-${Date.now()}-${i}`,
          first_name: values[headers.indexOf('first_name')] || values[headers.indexOf('First Name')] || '',
          last_name: values[headers.indexOf('last_name')] || values[headers.indexOf('Last Name')] || '',
          email: values[headers.indexOf('email')] || values[headers.indexOf('Email')] || '',
          title: values[headers.indexOf('title')] || values[headers.indexOf('Title')],
          company: values[headers.indexOf('company')] || values[headers.indexOf('Company')],
          linkedin_url: values[headers.indexOf('linkedin_url')] || values[headers.indexOf('LinkedIn URL')],
          lead_score: 0,
          lead_status: 'new',
          lead_source: 'csv-import',
          created_at: new Date()
        }

        if (lead.first_name && lead.email) {
          newLeads.push(lead)
        }
      }

      setLeads([...leads, ...newLeads])
      // Demo data is session-only (no persistence)
      setShowImportModal(false)
      alert(`Imported ${newLeads.length} leads successfully!`)
    }

    reader.readAsText(file)
  }

  const enrollInSequence = (sequenceId: string) => {
    if (selectedLeads.length === 0) {
      alert('Please select leads first')
      return
    }

    // In production, create enrollment records in database
    alert(`Enrolled ${selectedLeads.length} leads in sequence`)
    setSelectedLeads([])
  }

  const getStatusColor = (status: string) => {
    const colors = {
      new: 'bg-blue-500/20 text-blue-300',
      contacted: 'bg-yellow-500/20 text-yellow-300',
      engaged: 'bg-purple-500/20 text-purple-300',
      qualified: 'bg-green-500/20 text-green-300',
      scheduled: 'bg-cyan-500/20 text-cyan-300',
      converted: 'bg-green-600/20 text-green-400',
      lost: 'bg-red-500/20 text-red-300'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-500/20 text-gray-300'
  }

  const filteredLeads = leads.filter(lead => {
    const matchesStatus = filterStatus === 'all' || lead.lead_status === filterStatus
    const matchesSearch =
      lead.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.company?.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesStatus && matchesSearch
  })

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.lead_status === 'new').length,
    engaged: leads.filter(l => l.lead_status === 'engaged').length,
    qualified: leads.filter(l => l.lead_status === 'qualified').length,
    scheduled: leads.filter(l => l.lead_status === 'scheduled').length,
    converted: leads.filter(l => l.lead_status === 'converted').length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Lead Generation System</h2>
          <p className="text-slate-400">Manage LinkedIn leads and automate follow-ups</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors text-white"
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </button>
          <button
            onClick={() => {
              setEditingLead(null)
              setShowLeadModal(true)
            }}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors text-white"
          >
            <Plus className="w-4 h-4" />
            Add Lead
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Leads', value: stats.total, color: 'cyan' },
          { label: 'New', value: stats.new, color: 'blue' },
          { label: 'Engaged', value: stats.engaged, color: 'purple' },
          { label: 'Qualified', value: stats.qualified, color: 'green' },
          { label: 'Scheduled', value: stats.scheduled, color: 'yellow' },
          { label: 'Converted', value: stats.converted, color: 'pink' }
        ].map((stat) => (
          <div key={stat.label} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <p className="text-sm text-slate-400">{stat.label}</p>
            <p className={`text-2xl font-bold text-${stat.color}-400`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* View Tabs */}
      <div className="flex space-x-2 bg-slate-800 rounded-lg p-1">
        {[
          { id: 'leads', label: 'Leads', icon: Users },
          { id: 'sequences', label: 'Email Sequences', icon: Mail },
          { id: 'analytics', label: 'Analytics', icon: TrendingUp }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveView(id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              activeView === id
                ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white'
                : 'text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Leads View */}
      {activeView === 'leads' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-400"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="engaged">Engaged</option>
              <option value="qualified">Qualified</option>
              <option value="scheduled">Scheduled</option>
              <option value="converted">Converted</option>
              <option value="lost">Lost</option>
            </select>

            {selectedLeads.length > 0 && (
              <div className="flex gap-2">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      enrollInSequence(e.target.value)
                      e.target.value = ''
                    }
                  }}
                  className="bg-purple-600 hover:bg-purple-700 border-none rounded-lg px-4 py-2 text-white"
                >
                  <option value="">Enroll in Sequence</option>
                  {sequences.map(seq => (
                    <option key={seq.id} value={seq.id}>{seq.name}</option>
                  ))}
                </select>
                <span className="bg-slate-700 px-3 py-2 rounded-lg text-white">
                  {selectedLeads.length} selected
                </span>
              </div>
            )}
          </div>

          {/* Leads Table */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-900">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedLeads(filteredLeads.map(l => l.id))
                        } else {
                          setSelectedLeads([])
                        }
                      }}
                      className="w-4 h-4"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Company</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Title</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Score</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Next Follow-up</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-750 transition-colors">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedLeads.includes(lead.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLeads([...selectedLeads, lead.id])
                          } else {
                            setSelectedLeads(selectedLeads.filter(id => id !== lead.id))
                          }
                        }}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-white">{lead.first_name} {lead.last_name}</p>
                        <p className="text-sm text-slate-400">{lead.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{lead.company || '-'}</td>
                    <td className="px-4 py-3 text-slate-300">{lead.title || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(lead.lead_status)}`}>
                        {lead.lead_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-12 bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-cyan-500 h-2 rounded-full"
                            style={{ width: `${lead.lead_score}%` }}
                          />
                        </div>
                        <span className="text-sm text-slate-300">{lead.lead_score}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {lead.next_follow_up_at ? new Date(lead.next_follow_up_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingLead(lead)
                            setShowLeadModal(true)
                          }}
                          className="text-blue-400 hover:text-blue-300 p-1"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete lead ${lead.first_name} ${lead.last_name}?`)) {
                              setLeads(leads.filter(l => l.id !== lead.id))
                              saveLeads()
                            }
                          }}
                          className="text-red-400 hover:text-red-300 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredLeads.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                No leads found. Import a CSV or add leads manually.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Email Sequences View */}
      {activeView === 'sequences' && (
        <div className="space-y-4">
          <div className="grid gap-4">
            {sequences.map((sequence) => (
              <div key={sequence.id} className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{sequence.name}</h3>
                    <p className="text-slate-400">{sequence.description}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${sequence.is_active ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                    {sequence.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400">Delay Between Emails</p>
                    <p className="text-white font-medium">{sequence.delay_days} days</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Max Emails</p>
                    <p className="text-white font-medium">{sequence.max_emails}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Enrolled Leads</p>
                    <p className="text-white font-medium">0</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-6 max-w-lg w-full">
            <h3 className="text-xl font-bold text-white mb-4">Import Leads from CSV</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Upload CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVImport}
                  className="w-full text-slate-300"
                />
              </div>

              <div className="bg-slate-900 rounded p-4">
                <p className="text-sm text-slate-300 mb-2">Expected CSV format:</p>
                <code className="text-xs text-cyan-400">
                  first_name,last_name,email,title,company,linkedin_url
                </code>
              </div>

              <div className="text-sm text-slate-400">
                <p>• Download leads from LinkedIn Sales Navigator</p>
                <p>• Export as CSV</p>
                <p>• Upload here to start automated follow-ups</p>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowImportModal(false)}
                className="flex-1 bg-slate-600 hover:bg-slate-700 px-4 py-2 rounded-lg text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LeadManagement
