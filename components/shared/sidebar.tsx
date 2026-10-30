"use client"

interface SidebarProps {
  repName?: string
  repDesignation?: string
  repWhatsapp?: string
  hospitalName?: string
  hospitalCity?: string
  hospitalLogo?: string
  hospitalImage?: string
  meetings?: any[]
  selectedMeetingIndex?: number
  onSelectMeeting?: (index: number) => void
  onAddMeeting?: () => void
}

export function Sidebar({
  repName = "Sales Rep",
  repDesignation = "Field Sales Executive",
  repWhatsapp = "",
  hospitalName,
  hospitalCity,
  hospitalLogo,
  hospitalImage,
  meetings = [],
  selectedMeetingIndex = 0,
  onSelectMeeting = () => {},
  onAddMeeting = () => {},
}: SidebarProps) {
  const initials = repName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const today = new Date().toISOString().split('T')[0]
  const todayMeetings = meetings.filter((m) => m.meetingDate === today)
  const upcomingMeetings = meetings.filter((m) => m.meetingDate > today)

  return (
    <aside className="w-[260px] h-screen bg-[#1e3a5f] border-r border-[#30363D] flex flex-col shrink-0 relative z-10">
      <div className="p-5 border-b border-[#30363D]">
        <h1 className="text-[#E6EDF3] text-xl font-medium">Sales Agent</h1>
        <p className="text-[#8B949E] text-[11px] uppercase tracking-wider mt-0.5">Field Intelligence</p>
      </div>

      {meetings.length > 0 && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {todayMeetings.length > 0 && (
            <div>
              <p className="text-[#8B949E] text-[10px] uppercase tracking-wider font-semibold mb-2 px-1">Today's Meetings</p>
              <div className="space-y-2">
                {todayMeetings.map((meeting, idx) => {
                  const actualIdx = meetings.indexOf(meeting)
                  return (
                    <button
                      key={actualIdx}
                      onClick={() => onSelectMeeting(actualIdx)}
                      className={`cursor-pointer w-full text-left p-3 rounded-lg transition-colors ${
                        actualIdx === selectedMeetingIndex
                          ? "bg-[#58A6FF] text-white"
                          : "bg-[#21262D] text-[#E6EDF3] hover:bg-[#30363D]"
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        {(meeting.hospitalImage || meeting.hospitalLogo) && (
                          <img src={meeting.hospitalImage || meeting.hospitalLogo} alt={meeting.hospitalName} className="w-12 h-12 rounded object-cover flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{meeting.hospitalName}</p>
                          <p className={`text-xs ${actualIdx === selectedMeetingIndex ? "text-blue-100" : "text-[#8B949E]"}`}>{meeting.city}</p>
                          <p className={`text-xs ${actualIdx === selectedMeetingIndex ? "text-blue-100" : "text-[#8B949E]"}`}>
                            {meeting.meetingDate ? new Date(meeting.meetingDate).toLocaleDateString('en-GB').replace(/\//g, '-') : "No date"}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          {upcomingMeetings.length > 0 && (
            <div>
              <p className="text-[#8B949E] text-[10px] uppercase tracking-wider font-semibold mb-2 px-1">Upcoming Meetings</p>
              <div className="space-y-2">
                {upcomingMeetings.map((meeting, idx) => {
                  const actualIdx = meetings.indexOf(meeting)
                  return (
                    <button
                      key={actualIdx}
                      onClick={() => onSelectMeeting(actualIdx)}
                      className={`cursor-pointer w-full text-left p-3 rounded-lg transition-colors ${
                        actualIdx === selectedMeetingIndex
                          ? "bg-[#58A6FF] text-white"
                          : "bg-[#21262D] text-[#E6EDF3] hover:bg-[#30363D]"
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        {(meeting.hospitalImage || meeting.hospitalLogo) && (
                          <img src={meeting.hospitalImage || meeting.hospitalLogo} alt={meeting.hospitalName} className="w-12 h-12 rounded object-cover flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{meeting.hospitalName}</p>
                          <p className={`text-xs ${actualIdx === selectedMeetingIndex ? "text-blue-100" : "text-[#8B949E]"}`}>{meeting.city}</p>
                          <p className={`text-xs ${actualIdx === selectedMeetingIndex ? "text-blue-100" : "text-[#8B949E]"}`}>
                            {meeting.meetingDate ? new Date(meeting.meetingDate).toLocaleDateString('en-GB').replace(/\//g, '-') : "No date"}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          <button onClick={onAddMeeting} className="cursor-pointer w-full text-[#58A6FF] p-3 rounded-lg border border-[#58A6FF]/30 hover:bg-[#58A6FF]/10 transition-colors text-sm font-medium mt-2">
            + Add Meeting
          </button>
        </div>
      )}

      <div className="p-4 border-t border-[#30363D]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#58A6FF] flex items-center justify-center">
            <span className="text-white text-xs font-medium">{initials}</span>
          </div>
          <div>
            <p className="text-[#E6EDF3] text-[13px] font-medium">{repName}</p>
            <p className="text-[#8B949E] text-[11px]">{repDesignation}</p>
            {repWhatsapp && <p className="text-[#8B949E] text-[11px]">{repWhatsapp}</p>}
          </div>
        </div>
      </div>
    </aside>
  )
}
