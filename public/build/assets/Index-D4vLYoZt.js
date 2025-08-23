import{j as e}from"./ui-D1w9Iw8H.js";import{r as p}from"./recharts-Dld1lWsf.js";import{K as dt,L as ct,S as ee,t as S}from"./app-BrhaLMHT.js";import{A as mt}from"./app-layout-D3FvdgdG.js";import{B as h}from"./button-BntSAybs.js";import{B as pt}from"./format-Drb4gU7T.js";import{D as U,a as R,b as P,c as O}from"./dialog-DEtPFUl_.js";import{v as m,C as ht,m as xt,h as v}from"./react-big-calendar-BrYY6-2y.js";import{C as f,a as Oe}from"./circle-check-big-DZU7S_eA.js";import{U as G}from"./user-CtzshXh0.js";import{R as bt}from"./rotate-ccw-DuBc0qOm.js";import{C as gt,a as ut}from"./x-BL7C5EPd.js";import{C as q}from"./circle-play-Cy8QUXnz.js";import{C as ft}from"./chevron-left-BbzonqSg.js";import{C as te}from"./clock-BxVJL7PR.js";import{M as re}from"./map-pin-CGVzMw_j.js";import"./react-B1hewrmX.js";import"./utils-B66yfQja.js";import"./tooltip-CQHbb0yU.js";import"./check-CkciTNW-.js";import"./createLucideIcon-CR-66RMC.js";import"./index-CWijjM2R.js";import"./index-cS_AKGRi.js";import"./index-DrdTBqzy.js";import"./chevrons-up-down-BF_I81uV.js";import"./memoize-one.esm-DMzj5eV4.js";v.locale("en");const vt=xt(v),wt=`
/* Base Calendar - Clean Modern Look */
.rbc-calendar {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #ffffff;
    border: none;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: none;
}

/* Header - Google Calendar Style */
.rbc-header {
    background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
    color: #334155;
    border: none;
    border-bottom: 1px solid #e2e8f0;
    padding: 16px 12px;
    font-weight: 600;
    font-size: 13px;
    text-align: center;
    letter-spacing: 0.025em;
    position: relative;
}

.rbc-header:hover {
    background: linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%);
    transition: background 0.2s ease;
}

.rbc-header + .rbc-header {
    border-left: 1px solid #e2e8f0;
}

/* Week View Header - Force single cell appearance per day */
.rbc-time-header .rbc-header {
    border-left: none !important;
    border-right: 1px solid #e2e8f0 !important;
    background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%) !important;
}

.rbc-time-header .rbc-header:first-child {
    border-left: none !important;
}

.rbc-time-header .rbc-header:last-child {
    border-right: none !important;
}

/* Hide internal subdivisions in day headers */
.rbc-time-header-gutter + .rbc-header,
.rbc-time-header .rbc-header ~ .rbc-header {
    border-left: 1px solid #e2e8f0 !important;
}

/* Ensure day headers span full width without subdivisions */
.rbc-time-view .rbc-time-header {
    display: flex !important;
}

.rbc-time-view .rbc-time-header .rbc-header {
    flex: 1 !important;
    min-width: 0 !important;
}

/* Fix for rbc-row-bg - Remove internal subdivisions */
.rbc-row-bg {
    display: flex !important;
}

.rbc-row-bg .rbc-day-bg {
    border-left: 1px solid #f1f5f9 !important;
    border-right: none !important;
    flex: 1 !important;
}

.rbc-row-bg .rbc-day-bg:first-child {
    border-left: none !important;
}

.rbc-row-bg .rbc-day-bg:last-child {
    border-right: none !important;
}

/* Hide extra day-bg elements that create subdivisions */
.rbc-time-view .rbc-row-bg .rbc-day-bg + .rbc-day-bg + .rbc-day-bg {
    display: none !important;
}

.rbc-time-view .rbc-row-bg .rbc-day-bg + .rbc-day-bg:not(:last-child) {
    display: none !important;
}

/* Today Cell - Subtle Highlight */
.rbc-today {
    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
    border-radius: 8px;
    position: relative;
}

.rbc-today::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, rgba(59, 130, 246, 0.05), transparent, rgba(59, 130, 246, 0.05));
    border-radius: 8px;
    animation: subtlePulse 3s infinite;
}

@keyframes subtlePulse {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 0.6; }
}

/* Date Cells - Clean and Interactive */
.rbc-date-cell {
    padding: 12px 8px;
    border-right: 1px solid #f1f5f9;
    font-weight: 500;
    color: #475569;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    background: #ffffff;
    position: relative;
}

.rbc-date-cell:hover {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.rbc-off-range-bg {
    background: #fafafa;
}

.rbc-off-range {
    color: #94a3b8;
    opacity: 0.7;
}

/* Current Time Indicator - Blue Line */
.rbc-current-time-indicator {
    background: linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%);
    height: 2px;
    z-index: 10;
    box-shadow: 0 0 8px rgba(59, 130, 246, 0.4);
    border-radius: 1px;
}

/* Time Slots - Minimal and Clean */
.rbc-time-slot {
    border-top: 1px solid #f8fafc;
    min-height: 80px;
    transition: background-color 0.15s ease;
    background: #ffffff;
}

.rbc-time-slot:hover {
    background: rgba(59, 130, 246, 0.02);
}

.rbc-timeslot-group {
    border-bottom: 1px solid #f1f5f9;
    min-height: 80px;
}

/* Week View - Force single cells per hour */
.rbc-time-view .rbc-timeslot-group {
    min-height: 80px !important;
    height: 80px !important;
}

.rbc-time-view .rbc-time-slot {
    min-height: 80px !important;
    height: 80px !important;
    border-top: none !important;
}

.rbc-time-view .rbc-timeslot-group:last-child .rbc-time-slot {
    border-bottom: 1px solid #f1f5f9 !important;
}

.rbc-time-gutter .rbc-timeslot-group {
    border-right: 1px solid #f1f5f9;
}

.rbc-time-header-gutter {
    background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
    border-right: 1px solid #e2e8f0;
}

.rbc-time-gutter {
    background: #fafafa;
    border-right: 1px solid #f1f5f9;
}

.rbc-time-slot-time {
    font-size: 11px;
    color: #64748b;
    font-weight: 500;
    padding: 4px 8px;
    text-align: right;
}

/* Events - Modern Card Style */
.rbc-day-slot .rbc-event, .rbc-week-view .rbc-event {
    border: none;
    border-radius: 8px;
    margin: 1px 2px;
    padding: 0;
    min-height: 75px !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.06);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(10px);
}

.rbc-event {
    border-radius: 8px;
    border: none !important;
    color: white !important;
    font-size: 12px;
    padding: 0 !important;
    overflow: hidden !important;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.06);
    position: relative;
    display: flex !important;
    flex-direction: column !important;
    height: auto !important;
}

.rbc-event:hover {
    transform: translateY(-2px) scale(1.01);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15), 0 3px 10px rgba(0, 0, 0, 0.08);
    z-index: 999;
    overflow: visible !important;
}

.rbc-event:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
}

.rbc-event-content {
    overflow: hidden !important;
    white-space: normal !important;
    line-height: 1.3;
    height: 100% !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: flex-start !important;
    padding: 0 !important;
    position: relative;
    z-index: 2;
}

/* Month View - Clean Grid */
.rbc-month-view {
    background: #ffffff;
    border-radius: 16px;
    overflow: hidden;
}

.rbc-month-row {
    border-bottom: 1px solid #f1f5f9;
}

.rbc-month-row:last-child {
    border-bottom: none;
}

.rbc-date-cell a {
    color: #475569;
    font-weight: 600;
    text-decoration: none;
    padding: 6px 8px;
    border-radius: 8px;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    display: inline-block;
    position: relative;
}

.rbc-date-cell a:hover {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: #ffffff;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.rbc-date-cell.rbc-today a {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: #ffffff;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

/* Agenda View - List Style */
.rbc-agenda-view {
    background: #ffffff;
    border-radius: 16px;
    overflow: hidden;
}

.rbc-agenda-view table.rbc-agenda-table {
    font-size: 14px;
    width: 100%;
}

.rbc-agenda-view .rbc-agenda-content {
    padding: 16px;
}

.rbc-agenda-view .rbc-event {
    background: none !important;
    border: none !important;
    color: inherit !important;
    min-height: auto;
    padding: 12px 16px;
    border-radius: 12px;
    margin: 4px 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    border-left: 3px solid #3b82f6 !important;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%) !important;
    position: relative;
    overflow: visible !important;
}

.rbc-agenda-view .rbc-event:hover {
    transform: translateX(4px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%) !important;
    border-left-width: 4px !important;
}

.rbc-agenda-date-cell {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    font-weight: 600;
    color: #475569;
    padding: 12px 16px;
    border-bottom: 1px solid #f1f5f9;
}

.rbc-agenda-time-cell {
    background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
    font-weight: 500;
    color: #64748b;
    padding: 12px 16px;
    border-bottom: 1px solid #f1f5f9;
    font-size: 13px;
}

.rbc-agenda-event-cell {
    padding: 12px 16px;
    border-bottom: 1px solid #f1f5f9;
    overflow: visible !important;
}

/* Agenda View - Fix overflow for tooltips */
.rbc-agenda-view,
.rbc-agenda-view table,
.rbc-agenda-view tbody,
.rbc-agenda-view tr,
.rbc-agenda-view td {
    overflow: visible !important;
}

.rbc-agenda-date-cell,
.rbc-agenda-time-cell {
    overflow: visible !important;
}

/* Special handling for agenda tooltips */
.rbc-agenda-view .group:hover .absolute {
    z-index: 10000 !important;
    transform: translateX(8px) !important;
}

/* Ensure agenda table cells don't clip tooltips */
.rbc-agenda-view table.rbc-agenda-table td {
    position: relative;
    overflow: visible !important;
}

.rbc-agenda-view .rbc-event .group {
    position: relative;
    z-index: 1;
}

.rbc-agenda-view .rbc-event:hover {
    z-index: 100 !important;
    overflow: visible !important;
}

/* Week/Time Views */
.rbc-time-view {
    background: #ffffff;
    border-radius: 16px;
    overflow: hidden;
}

.rbc-time-header {
    background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
    border-bottom: 1px solid #f1f5f9;
}

.rbc-time-content {
    border: none;
    background: #ffffff;
}

.rbc-allday-cell {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-bottom: 2px solid #e2e8f0;
    padding: 0px 0;
    visibility: hidden;
    display: none !important;
}

/* Fix for rbc-allday-cell - Remove internal subdivisions */
.rbc-time-view .rbc-allday-cell {
    border-left: none !important;
    border-right: 1px solid #e2e8f0 !important;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%) !important;
    display: none !important;
    flex: 1 !important;
}

.rbc-time-view .rbc-allday-cell:first-child {
    border-left: none !important;
}

.rbc-time-view .rbc-allday-cell:last-child {
    border-right: none !important;
}

/* Hide extra allday cells that create subdivisions */
.rbc-time-view .rbc-header-row .rbc-allday-cell + .rbc-allday-cell + .rbc-allday-cell {
    display: none !important;
}

.rbc-time-view .rbc-header-row .rbc-allday-cell + .rbc-allday-cell:not(:last-child) {
    display: none !important;
}

.rbc-row-content {
    border-bottom: 1px solid #f1f5f9;
}

/* Custom Scrollbar - Minimal */
.rbc-time-content::-webkit-scrollbar {
    width: 8px;
}

.rbc-time-content::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
}

.rbc-time-content::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%);
    border-radius: 4px;
    border: 1px solid #f1f5f9;
}

.rbc-time-content::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%);
}

/* Tooltip positioning and overflow fix */
.rbc-calendar,
.rbc-time-view,
.rbc-time-content {
    overflow: visible !important;
}

.rbc-time-header,
.rbc-time-slot,
.rbc-timeslot-group {
    overflow: visible !important;
}

/* Calendar container should allow tooltips to overflow */
.rbc-calendar .rbc-time-view .rbc-time-content {
    overflow-x: hidden !important;
    overflow-y: auto !important;
}

.rbc-calendar .rbc-day-slot,
.rbc-calendar .rbc-time-slot {
    overflow: visible !important;
}

/* Ensure tooltips are always on top */
.group:hover .absolute {
    z-index: 9999 !important;
}

/* Prevent tooltip clipping in calendar cells */
.rbc-day-slot .rbc-event,
.rbc-week-view .rbc-event {
    overflow: visible !important;
}

/* Custom Event Content - Clean Typography */
.custom-event-content {
    color: #ffffff !important;
    position: relative;
    overflow: visible !important;
}

.custom-event-content * {
    color: #ffffff !important;
    position: relative;
    z-index: 2;
}

.custom-event-content .event-time {
    color: #ffffff !important;
    font-weight: 600 !important;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.custom-event-content .event-client {
    color: #ffffff !important;
    font-weight: 700 !important;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.custom-event-content .event-title {
    color: #ffffff !important;
    font-weight: 500 !important;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.custom-event-content .event-location {
    color: #ffffff !important;
    opacity: 0.95 !important;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.custom-event-content svg {
    color: #ffffff !important;
    filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.1));
}

/* Loading Animation - Subtle */
@keyframes eventAppear {
    0% { 
        opacity: 0; 
        transform: translateY(10px) scale(0.95); 
    }
    100% { 
        opacity: 1; 
        transform: translateY(0) scale(1); 
    }
}

.rbc-event {
    animation: eventAppear 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Responsive Design */
@media (max-width: 768px) {
    .rbc-calendar {
        border-radius: 12px;
    }
    
    .rbc-header {
        padding: 8px 6px;
        font-size: 11px;
    }
    
    .rbc-time-slot-time {
        font-size: 10px;
        padding: 2px 6px;
    }
    
    .rbc-event {
        border-radius: 6px;
        min-height: 40px !important;
    }
    
    .rbc-date-cell {
        padding: 8px 4px;
    }
}

/* Focus States for Accessibility */
.rbc-calendar *:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
    border-radius: 4px;
}

/* Selection States */
.rbc-selected {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%) !important;
    color: white !important;
}

/* Drag and Drop States */
.rbc-addons-dnd-drag-row {
    background: rgba(59, 130, 246, 0.1);
}

.rbc-addons-dnd-over {
    background: rgba(59, 130, 246, 0.2);
}

/* Custom Scrollbar for Modal */
.custom-scrollbar::-webkit-scrollbar {
    width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(148, 163, 184, 0.1);
    border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #64748b, #475569);
    border-radius: 10px;
    border: 2px solid transparent;
    background-clip: content-box;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, #475569, #334155);
    background-clip: content-box;
}

/* Animation for modal elements */
@keyframes slideInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-slide-in-up {
    animation: slideInUp 0.3s ease-out;
}

/* Glass effect for modal cards */
.glass-effect {
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    background: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.2);
}
`,ae={scheduled:{label:"Scheduled",color:"bg-blue-100 text-blue-800",bgColor:"#3B82F6",icon:f},in_progress:{label:"In Progress",color:"bg-yellow-100 text-yellow-800",bgColor:"#F59E0B",icon:q},completed:{label:"Completed",color:"bg-green-100 text-green-800",bgColor:"#10B981",icon:Oe},cancelled:{label:"Cancelled",color:"bg-red-100 text-red-800",bgColor:"#EF4444",icon:gt},rescheduled:{label:"Rescheduled",color:"bg-gray-100 text-gray-800",bgColor:"#6B7280",icon:bt},no_show:{label:"No Show",color:"bg-orange-100 text-orange-800",bgColor:"#F97316",icon:G}};function Qt({appointments:Ge,technicals:jt,auth:K,isTechnicalDefault:w,googleMapsApiKey:Y}){var ue,fe,ve,we,je,Ne,ke,ye,Ce,Me,Se,De,Ae,Ee,_e,Te,ze,$e,Le,Ye,Be,He,Fe,We,Ie,Ve,Ue;const[se,qe]=p.useState(null),[Nt,kt]=p.useState(!1),{props:yt}=dt(),j=(fe=(ue=K.user)==null?void 0:ue.roles)==null?void 0:fe.includes("technical"),Ke=(we=(ve=K.user)==null?void 0:ve.roles)==null?void 0:we.includes("super-admin"),Xe=j||w?m.AGENDA:m.DAY,[x,oe]=p.useState(Xe),[B,ne]=p.useState(new Date),[le,ie]=p.useState([]),[Ct,de]=p.useState(!1),[a,N]=p.useState({open:!1}),[H,ce]=p.useState({open:!1}),[X,F]=p.useState({open:!1}),[k,W]=p.useState({reason:"",description:"",notifyMember:!0,rescheduleOffered:!1}),[J,me]=p.useState(!1),[i,I]=p.useState({open:!1}),Je=[{value:"member_not_home",label:"Member Not Home",description:"Member was not present at the scheduled time"},{value:"no_response",label:"No Response",description:"Member did not respond to door/calls"},{value:"refused_service",label:"Refused Service",description:"Member refused to allow technician entry"},{value:"wrong_time",label:"Wrong Time",description:"Member expected different time"},{value:"emergency",label:"Member Emergency",description:"Member had an emergency and could not attend"},{value:"technical_issue",label:"Technical Issue",description:"Technical problem prevented the visit"},{value:"weather",label:"Weather Conditions",description:"Weather prevented the visit"},{value:"other",label:"Other",description:"Other reason not listed above"}],Qe=t=>{if(!t)return"";if(t.includes("maps.app.goo.gl"))return`https://www.google.com/maps/embed/v1/place?key=${Y}&q=-10.916879,-74.883391&zoom=15`;if(t.includes("/embed"))return t;if(t.includes("google.com/maps")){const r=t.match(/@([-0-9.]+),([-0-9.]+)/);if(r)return`https://www.google.com/maps/embed/v1/view?key=${Y}&center=${r[1]},${r[2]}&zoom=15`;const s=t.match(/place\/([^\/]+)/);if(s)return`https://www.google.com/maps/embed/v1/place?key=${Y}&q=place_id:${s[1]}`}return`https://www.google.com/maps/embed/v1/place?key=${Y}&q=${encodeURIComponent(t)}`},Ze=async t=>{console.log("fetchFullAppointmentData called with ID:",t);try{const r=await fetch(`/appointments/${t}/details`);if(console.log("API response status:",r.status),r.ok){const s=await r.json();return console.log("Received appointment data:",s),s.appointment}else console.error("API response not ok:",r.status,r.statusText)}catch(r){console.error("Error fetching appointment details:",r)}return null},pe=async(t,r="view")=>{var n,o,l,c;if(console.log("openAppointmentModal called with:",{appointment:t,action:r}),(o=(n=t==null?void 0:t.ticket)==null?void 0:n.device)!=null&&o.tenants||(c=(l=t==null?void 0:t.ticket)==null?void 0:l.user)!=null&&c.tenant){console.log("Using existing appointment data - has relationships"),N({open:!0,appointment:t});return}console.log("Fetching full appointment data for ID:",t.id);const s=await Ze(t.id);s?(console.log("Successfully fetched full appointment data:",s),N({open:!0,appointment:s})):(console.log("Failed to fetch full appointment data, using fallback"),N({open:!0,appointment:t}))},et=async t=>{if(t){de(!0);try{const s=await(await fetch(`/appointments/${t}`)).json();qe(s)}catch(r){console.error("Error refreshing appointment:",r)}finally{de(!1)}}},u=Ge;p.useEffect(()=>{const t=()=>{const s=new Date,n=new Date(s.getTime()+30*60*1e3);u.forEach(o=>{if(o.status==="scheduled"){const l=new Date(o.scheduled_for);if(l<=n&&l>s){const c=Math.floor((l.getTime()-s.getTime())/6e4),d=j||w?`🔔 You have an appointment in ${c} minutes with ${o.ticket.user.name}: ${o.title}`:`Upcoming appointment in ${c} minutes: ${o.title}`;ie(b=>b.includes(d)?b:[...b,d])}}})};t();const r=setInterval(t,6e4);return()=>clearInterval(r)},[u,j,w]);const he=t=>ae[t]||ae.scheduled,tt=p.useMemo(()=>{const t=u.map(r=>{const s=new Date(r.scheduled_for),n=s.getHours();let o=r.estimated_duration;if(n>=18){const c=(24-n)*60-s.getMinutes();n>=22?o=Math.min(30,c-30):o=Math.min(o,c-60),o=Math.max(15,o)}const l=new Date(s.getTime()+o*6e4);return console.log("🗓️ Converting appointment:",{id:r.id,title:r.title,scheduled_for:r.scheduled_for,originalDuration:r.estimated_duration,adjustedDuration:o,start:s.toISOString(),end:l.toISOString(),startDay:s.getDate(),endDay:l.getDate(),hour:n,isNightEvent:n>=18,startsAt:s.toLocaleTimeString(),endsAt:l.toLocaleTimeString()}),{id:r.id,title:`${r.ticket.user.name} - ${r.title}`,start:s,end:l,resource:r,allDay:!1}});return console.log("🗓️ Total calendar events created:",t.length),t},[u]),rt=t=>{pe(t.resource)},at=t=>{console.log("Selected slot:",t)},Q=t=>{let r=new Date(B);switch(t){case"prev":x===m.DAY?r.setDate(r.getDate()-1):x===m.WEEK?r.setDate(r.getDate()-7):x===m.MONTH&&r.setMonth(r.getMonth()-1);break;case"next":x===m.DAY?r.setDate(r.getDate()+1):x===m.WEEK?r.setDate(r.getDate()+7):x===m.MONTH&&r.setMonth(r.getMonth()+1);break;case"today":r=new Date;break}ne(r)},st=()=>{const t=v(B);switch(x){case m.DAY:return t.format("dddd, MMMM Do YYYY");case m.WEEK:{const r=t.clone().startOf("week"),s=t.clone().endOf("week");return`${r.format("MMM Do")} - ${s.format("MMM Do, YYYY")}`}case m.MONTH:return t.format("MMMM YYYY");case m.AGENDA:return"Agenda View";default:return t.format("MMMM YYYY")}},xe=async(t,r,s)=>{try{const n=t==="member_feedback"?"member-feedback":t;ee.post(`/appointments/${r}/${n}`,s||{},{preserveScroll:!0,onSuccess:o=>{const l=o.props.flash||{},c={start:"Visit started successfully!",complete:"Visit completed successfully! Waiting for member feedback.",member_feedback:"Thank you for your feedback!",cancel:"Appointment cancelled successfully!",reschedule:"Appointment rescheduled successfully!","no-show":"Appointment marked as No Show successfully!"},d=l.success||l.message||c[t]||`${t} completed successfully`;S.success(d),se&&et(se.id)},onError:o=>{console.error(`Error ${t} appointment:`,o),typeof o=="object"&&o!==null?Object.values(o).flat().forEach(c=>{typeof c=="string"&&S.error(c)}):S.error(`Error processing ${t} action`)}})}catch(n){console.error(`Error ${t} appointment:`,n),S.error(`Error processing ${t} action`)}},ot=async()=>{try{if(!X.appointment)return;me(!0),await ee.post(route("appointments.no-show",X.appointment.id),{reason:k.reason,description:k.description||null}),S.success("Appointment marked as No Show successfully"),F({open:!1}),W({reason:"",description:"",notifyMember:!0,rescheduleOffered:!1}),ee.reload()}catch(t){console.error("Error marking appointment as no-show:",t),S.error("Error marking appointment as no-show")}finally{me(!1)}},nt=t=>({style:{border:"none",borderRadius:"8px",padding:"0",backgroundColor:"transparent",overflow:"visible"}}),lt=({event:t})=>{var D,A,E,_,T,z,$,L;const r=t.resource;he(r.status).icon;const n={scheduled:"linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",in_progress:"linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",completed:"linear-gradient(135deg, #10B981 0%, #059669 100%)",cancelled:"linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",rescheduled:"linear-gradient(135deg, #6B7280 0%, #4B5563 100%)",no_show:"linear-gradient(135deg, #F97316 0%, #EA580C 100%)"},o=r.technical||{},l=o.photo||o.photo_url||o.avatar_url||o.avatar||null,c=o.name||"";o.email,o.phone;const d=((A=(D=r.ticket)==null?void 0:D.user)==null?void 0:A.tenant)||{};d.photo||d.photo_url||d.avatar_url||d.avatar;const b=d.name||d.name,y=d.email||d.emai;d.phone||d.phone,console.log(`Member data for appointment ${r.id}:`,{hasTicket:!!r.ticket,hasUser:!!((E=r.ticket)!=null&&E.user),hasTenant:!!((T=(_=r.ticket)==null?void 0:_.user)!=null&&T.tenant),memberName:b,memberEmail:y,memberData:d}),(z=r.ticket)!=null&&z.code||($=r.ticket)!=null&&$.number||(L=r.ticket)!=null&&L.id;function C(g){return g?g.split(" ").slice(0,2).map(V=>V[0]).join("").toUpperCase():""}return e.jsxs("div",{className:"w-full h-full text-white cursor-pointer hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 relative",style:{minHeight:"100%",height:"100%",borderRadius:"6px",background:n[r.status]||n.scheduled,border:"none",boxShadow:"0 2px 8px rgba(0, 0, 0, 0.1)",display:"flex",flexDirection:"row",padding:"6px",gap:"6px"},children:[e.jsx("div",{className:"flex-1 flex items-center justify-center min-w-0",children:e.jsx("div",{className:"text-sm line-clamp-3 font-semibold leading-tight text-white/95 cursor-pointer hover:text-white transition-colors duration-200",onClick:g=>{g.stopPropagation(),I({open:!0,user:d,type:"member"})},children:b||"N/A"})}),e.jsxs("div",{className:"flex flex-col justify-center items-center gap-1",children:[e.jsx("div",{className:"flex items-center gap-1",children:e.jsx("span",{className:"font-bold text-xs leading-none text-white/95",children:Z(r.scheduled_for)})}),e.jsx("div",{className:"relative cursor-pointer",onClick:g=>{g.stopPropagation(),I({open:!0,user:o,type:"technical"})},children:e.jsxs("div",{className:"w-6 h-6 rounded-full border border-white/30 overflow-hidden bg-white/20 hover:scale-110 transition-transform duration-200 relative",children:[l?e.jsx("img",{src:l.startsWith("/storage/")||l.startsWith("http")?l:`/storage/${l}`,alt:c,className:"w-full h-full object-cover",onError:g=>{g.currentTarget.style.display="none";const M=g.currentTarget.nextElementSibling;M&&(M.style.display="flex")}}):null,e.jsx("div",{className:"absolute inset-0 w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-xs font-bold text-white",style:{display:l?"none":"flex"},children:C(c)})]})})]}),e.jsx("div",{className:"absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-white/75 rounded-full"})]})};p.useEffect(()=>{(x===m.WEEK||x===m.DAY)&&setTimeout(()=>{const t=document.querySelector(".rbc-time-content");t&&(t.scrollTop=360,console.log("📅 Auto-scrolled to 6:00 AM in Week view"))},100)},[x,B]);const be=u.filter(t=>{const r=new Date(t.scheduled_for),s=new Date,n=new Date(s.getTime()+7*24*60*60*1e3);return r>=s&&r<=n&&t.status==="scheduled"}).sort((t,r)=>new Date(t.scheduled_for).getTime()-new Date(r.scheduled_for).getTime()),Z=t=>new Date(t).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit",hour12:!1}),it=t=>new Date(t).toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"}),ge=t=>{const r=he(t),s=r.icon;return e.jsxs(pt,{className:`${r.color} border-0`,children:[e.jsx(s,{className:"w-3 h-3 mr-1"}),r.label]})};return e.jsxs(mt,{breadcrumbs:[{title:"Calendar",href:"/appointments"}],children:[e.jsx(ct,{title:"Appointments Calendar"}),e.jsx("style",{dangerouslySetInnerHTML:{__html:wt}}),e.jsxs("div",{className:"min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50",children:[e.jsx("div",{className:"sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-slate-200/60 shadow-sm",children:e.jsx("div",{className:" mx-auto px-6 py-4",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{className:"flex items-center gap-4",children:[e.jsx("div",{className:"p-3 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg",children:e.jsx(f,{className:"w-8 h-8 text-white"})}),e.jsxs("div",{children:[e.jsx("h1",{className:"text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent",children:j||w?"My Schedule":"Calendar Management"}),e.jsx("p",{className:"text-sm text-slate-600 font-medium",children:j||w?`${K.user.name}'s appointments and tasks`:"Comprehensive appointment scheduling system"})]})]}),e.jsx("div",{className:"hidden lg:flex items-center gap-2",children:Object.entries(ae).map(([t,r])=>{const s=r.icon;return e.jsxs("div",{className:"flex items-center gap-2 px-3 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-white/40 shadow-sm hover:shadow-md transition-all duration-200",children:[e.jsx("div",{className:"w-2 h-2 rounded-full",style:{backgroundColor:r.bgColor}}),e.jsx(s,{className:"w-3.5 h-3.5 text-slate-600"}),e.jsx("span",{className:"text-xs font-medium text-slate-700",children:r.label})]},t)})})]})})}),le.length>0&&e.jsx("div",{className:" mx-auto px-6 pt-6",children:e.jsx("div",{className:"bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-2xl p-4 shadow-sm backdrop-blur-sm",children:e.jsxs("div",{className:"flex items-start gap-4",children:[e.jsx("div",{className:"p-2 bg-amber-100 rounded-xl",children:e.jsx(f,{className:"w-5 h-5 text-amber-600"})}),e.jsxs("div",{className:"flex-1",children:[e.jsx("h3",{className:"text-sm font-semibold text-amber-900 mb-2",children:"Upcoming Appointments"}),e.jsx("div",{className:"space-y-1",children:le.map((t,r)=>e.jsx("p",{className:"text-sm text-amber-800",children:t},r))})]}),e.jsx(h,{variant:"ghost",size:"sm",onClick:()=>ie([]),className:"p-2 h-8 w-8 rounded-full hover:bg-amber-100 text-amber-600 hover:text-amber-800",children:"×"})]})})}),e.jsx("div",{className:" mx-auto px-6 py-6",children:e.jsxs("div",{className:"grid grid-cols-1 xl:grid-cols-12 gap-6",children:[e.jsx("div",{className:"xl:col-span-9",children:e.jsxs("div",{className:"bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden",children:[e.jsx("div",{className:"bg-gradient-to-r from-white to-slate-50 border-b border-slate-100 p-6",children:e.jsxs("div",{className:"flex items-center justify-between flex-wrap gap-4",children:[e.jsxs("div",{className:"flex items-center gap-4",children:[e.jsxs("div",{className:"flex items-center gap-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-1",children:[e.jsx(h,{variant:"ghost",size:"sm",onClick:()=>Q("prev"),className:"h-10 w-10 rounded-xl hover:bg-slate-100",children:e.jsx(ft,{className:"w-4 h-4"})}),e.jsx(h,{variant:"ghost",size:"sm",onClick:()=>Q("today"),className:"px-6 h-10 rounded-xl font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors",children:"Today"}),e.jsx(h,{variant:"ghost",size:"sm",onClick:()=>Q("next"),className:"h-10 w-10 rounded-xl hover:bg-slate-100",children:e.jsx(ut,{className:"w-4 h-4"})})]}),e.jsx("div",{className:"px-4",children:e.jsx("h2",{className:"text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent",children:st()})})]}),e.jsx("div",{className:"flex items-center gap-1 bg-slate-100 rounded-2xl p-1",children:[{view:m.DAY,label:"Day",icon:f},{view:m.WEEK,label:"Week",icon:f},{view:m.MONTH,label:"Month",icon:f},{view:m.AGENDA,label:"Agenda",icon:f}].map(({view:t,label:r,icon:s})=>e.jsxs(h,{variant:x===t?"default":"ghost",size:"sm",onClick:()=>oe(t),className:`h-10 px-6 rounded-xl font-medium transition-all duration-200 ${x===t?"bg-white shadow-sm text-slate-900 hover:bg-white":"hover:bg-white/60 text-slate-600 hover:text-slate-900"}`,children:[e.jsx(s,{className:"w-4 h-4 mr-2"}),r]},t))})]})}),e.jsx("div",{className:"p-6",children:e.jsx("div",{className:"h-[800px] bg-white rounded-2xl shadow-inner border border-slate-100 overflow-visible",children:e.jsx(ht,{localizer:vt,events:tt,startAccessor:"start",endAccessor:"end",view:x,onView:oe,date:B,onNavigate:ne,onSelectEvent:rt,onSelectSlot:at,selectable:!0,eventPropGetter:nt,components:{event:lt,toolbar:()=>null},style:{height:"100%"},formats:{timeGutterFormat:"HH:mm",eventTimeRangeFormat:({start:t,end:r})=>`${v(t).format("HH:mm")} - ${v(r).format("HH:mm")}`,dayFormat:"ddd DD/MM",dateFormat:"DD",dayHeaderFormat:"dddd DD/MM/YYYY",dayRangeHeaderFormat:({start:t,end:r})=>`${v(t).format("DD/MM")} - ${v(r).format("DD/MM/YYYY")}`,agendaDateFormat:"dddd DD/MM/YYYY",agendaTimeFormat:"HH:mm",agendaTimeRangeFormat:({start:t,end:r})=>`${v(t).format("HH:mm")} - ${v(r).format("HH:mm")}`},min:new Date(2025,0,1,0,0,0),max:new Date(2025,0,1,23,59,59),step:60,timeslots:1,views:{day:!0,week:!0,month:!0,agenda:!0},showMultiDayTimes:!0,popup:!0,popupOffset:30,scrollToTime:new Date(1970,1,1,6,0,0)})})})]})}),e.jsxs("div",{className:"xl:col-span-3 space-y-6",children:[e.jsxs("div",{className:"bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden",children:[e.jsx("div",{className:" bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-blue-100",children:e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"p-2 bg-blue-100 rounded-xl",children:e.jsx(te,{className:"w-5 h-5 text-blue-600"})}),e.jsx("h3",{className:"text-lg font-bold text-blue-900",children:"Upcoming"})]})}),e.jsx("div",{className:"p-6",children:be.length===0?e.jsxs("div",{className:"text-center py-8",children:[e.jsx("div",{className:"p-4 bg-slate-50 rounded-2xl mx-auto w-fit mb-4",children:e.jsx(f,{className:"w-8 h-8 text-slate-400"})}),e.jsx("p",{className:"text-slate-500 font-medium",children:"No upcoming appointments"})]}):e.jsx("div",{className:"space-y-3",children:be.slice(0,4).map(t=>e.jsxs("div",{className:"group relative bg-gradient-to-r from-slate-50 to-white rounded-2xl p-4 border border-slate-100 hover:shadow-lg hover:border-blue-200 transition-all duration-300 cursor-pointer",onClick:()=>pe(t),children:[e.jsx("div",{className:"absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"}),e.jsxs("div",{className:"relative",children:[e.jsxs("div",{className:"flex items-start justify-between mb-3",children:[e.jsxs("div",{className:"flex-1",children:[e.jsx("h4",{className:"font-semibold text-slate-900 mb-1 group-hover:text-blue-900 transition-colors",children:t.title}),e.jsx("p",{className:"text-sm text-slate-600 font-medium",children:t.ticket.user.name})]}),e.jsx("div",{className:"flex items-center gap-2",children:(j||w)&&t.status==="scheduled"&&e.jsxs(h,{size:"sm",onClick:r=>{r.stopPropagation(),xe("start",t.id)},className:"h-8 px-3 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-medium shadow-sm",children:[e.jsx(q,{className:"w-3 h-3 mr-1"}),"Start"]})})]}),e.jsxs("div",{className:"flex items-center gap-4 text-xs",children:[e.jsxs("div",{className:"flex items-center gap-1 text-slate-500",children:[e.jsx(te,{className:"w-3 h-3"}),Z(t.scheduled_for)]}),e.jsxs("div",{className:"flex items-center gap-1 text-slate-500",children:[e.jsx(G,{className:"w-3 h-3"}),t.technical.name]})]})]})]},t.id))})})]}),e.jsxs("div",{className:"bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden",children:[e.jsx("div",{className:"bg-gradient-to-r from-emerald-50 to-teal-50 p-6 border-b border-emerald-100",children:e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"p-2 bg-emerald-100 rounded-xl",children:e.jsx(Oe,{className:"w-5 h-5 text-emerald-600"})}),e.jsx("h3",{className:"text-lg font-bold text-emerald-900",children:"Statistics"})]})}),e.jsx("div",{className:"p-6",children:e.jsx("div",{className:"space-y-4",children:[{label:"Total",count:u.length,color:"text-slate-600"},{label:"Scheduled",count:u.filter(t=>t.status==="scheduled").length,color:"text-blue-600"},{label:"In Progress",count:u.filter(t=>t.status==="in_progress").length,color:"text-yellow-600"},{label:"Completed",count:u.filter(t=>t.status==="completed").length,color:"text-green-600"},{label:"No Show",count:u.filter(t=>t.status==="no_show").length,color:"text-orange-600"},{label:"Cancelled",count:u.filter(t=>t.status==="cancelled").length,color:"text-red-600"}].map(t=>e.jsxs("div",{className:"flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-100",children:[e.jsxs("span",{className:"text-sm font-medium text-slate-700",children:[t.label,":"]}),e.jsx("span",{className:`text-lg font-bold ${t.color}`,children:t.count})]},t.label))})})]})]})]})}),e.jsx(U,{open:a.open,onOpenChange:t=>N({open:t,appointment:a.appointment}),children:e.jsxs(R,{className:"sm:max-w-5xl max-h-[95vh] overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50",children:[e.jsxs("div",{className:"relative bg-gradient-to-r from-primary via-secondary to-primary -m-6 mb-8 p-8 text-white overflow-hidden",children:[e.jsx("div",{className:"absolute inset-0 bg-black/10"}),e.jsx("div",{className:"absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"}),e.jsx("div",{className:"absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"}),e.jsx(P,{className:"relative z-10",children:e.jsx(O,{className:"flex items-start justify-between",children:e.jsxs("div",{className:"flex items-center gap-4",children:[e.jsx("div",{className:"p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30",children:e.jsx(f,{className:"w-8 h-8 text-white"})}),e.jsxs("div",{children:[e.jsx("h1",{className:"text-3xl font-bold mb-2",children:((je=a.appointment)==null?void 0:je.title)||"Appointment Details"}),e.jsxs("div",{className:"flex items-center gap-3",children:[a.appointment&&ge(a.appointment.status),e.jsxs("span",{className:"text-white/80 text-sm",children:["#",((ke=(Ne=a.appointment)==null?void 0:Ne.ticket)==null?void 0:ke.code)||"N/A"]})]})]})]})})})]}),e.jsx("div",{className:"max-h-[65vh] overflow-y-auto px-1 custom-scrollbar",children:a.appointment&&e.jsxs("div",{className:"space-y-6",children:[e.jsxs("div",{className:"relative bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20 overflow-hidden",children:[e.jsx("div",{className:"absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full -translate-y-16 translate-x-16 opacity-50"}),e.jsxs("div",{className:"relative z-10",children:[e.jsx("div",{className:"flex items-center justify-between mb-8",children:e.jsxs("div",{className:"flex items-center gap-6",children:[e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"text-3xl font-bold text-slate-900 mb-1",children:new Date(a.appointment.scheduled_for).getDate()}),e.jsx("div",{className:"text-sm font-medium text-slate-600 uppercase tracking-wider",children:new Date(a.appointment.scheduled_for).toLocaleDateString("es",{month:"short"})})]}),e.jsx("div",{className:"h-16 w-px bg-gradient-to-b from-transparent via-slate-300 to-transparent"}),e.jsxs("div",{children:[e.jsx("div",{className:"text-xl font-bold text-slate-900 mb-1",children:Z(a.appointment.scheduled_for)}),e.jsx("div",{className:"text-sm text-slate-600",children:it(a.appointment.scheduled_for)})]})]})}),e.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-4 gap-6",children:[e.jsx("div",{className:"lg:col-span-2 group",children:e.jsx("div",{className:"bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100 hover:shadow-lg transition-all duration-300",children:e.jsxs("div",{className:"flex items-start justify-between",children:[e.jsxs("div",{className:"flex items-start gap-4 flex-1",children:[e.jsx("div",{className:"p-3 bg-green-500 rounded-xl shadow-lg",children:e.jsx(re,{className:"w-6 h-6 text-white"})}),e.jsxs("div",{className:"flex-1",children:[e.jsx("h3",{className:"text-lg font-bold text-green-900 mb-2",children:"Location"}),e.jsx("p",{className:"text-green-800 font-medium mb-1",children:(()=>{var o,l,c,d,b,y,C,D,A,E,_,T,z,$,L,g,M,V,Re,Pe;const t=a.appointment,r=((y=(b=(d=(c=(l=(o=t==null?void 0:t.ticket)==null?void 0:o.device)==null?void 0:l.tenants)==null?void 0:c[0])==null?void 0:d.apartment)==null?void 0:b.building)==null?void 0:y.name)||((_=(E=(A=(D=(C=t==null?void 0:t.ticket)==null?void 0:C.user)==null?void 0:D.tenant)==null?void 0:A.apartment)==null?void 0:E.building)==null?void 0:_.name)||"Building not specified",s=((g=(L=($=(z=(T=t==null?void 0:t.ticket)==null?void 0:T.device)==null?void 0:z.tenants)==null?void 0:$[0])==null?void 0:L.apartment)==null?void 0:g.name)||((Pe=(Re=(V=(M=t==null?void 0:t.ticket)==null?void 0:M.user)==null?void 0:V.tenant)==null?void 0:Re.apartment)==null?void 0:Pe.name);let n=r;return s&&(n+=` - ${s}`),n})()}),a.appointment.address&&e.jsx("p",{className:"text-sm text-green-700 opacity-80",children:a.appointment.address})]})]}),(()=>{var s,n,o,l,c,d,b,y,C;const t=a.appointment,r=((c=(l=(o=(n=(s=t==null?void 0:t.ticket)==null?void 0:s.device)==null?void 0:n.tenants)==null?void 0:o[0])==null?void 0:l.apartment)==null?void 0:c.building)||((C=(y=(b=(d=t==null?void 0:t.ticket)==null?void 0:d.user)==null?void 0:b.tenant)==null?void 0:y.apartment)==null?void 0:C.building);return r!=null&&r.location_link?e.jsx(h,{variant:"ghost",size:"sm",onClick:()=>ce({open:!0,building:r}),className:"ml-4 p-3 bg-white/60 hover:bg-white border border-green-200 hover:border-green-300 rounded-xl shadow-sm hover:shadow-md transition-all duration-200",title:"Ver en Mapa",children:e.jsx(re,{className:"w-5 h-5 text-green-600"})}):null})()]})})}),e.jsx("div",{className:"group",children:e.jsxs("div",{className:"bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-6 border border-purple-100 hover:shadow-lg transition-all duration-300 h-full",children:[e.jsx("div",{className:"flex items-center gap-4 mb-4",children:e.jsx("h3",{className:"text-lg font-bold text-purple-900",children:"Technician"})}),e.jsxs("div",{className:"text-center",children:[(ye=a.appointment.technical)!=null&&ye.photo?e.jsx("img",{src:`/storage/${a.appointment.technical.photo}`,alt:a.appointment.technical.name,className:"w-16 h-16 mx-auto mb-3 rounded-full object-cover shadow-lg border-2 border-purple-200"}):e.jsx("div",{className:"w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white font-bold text-xl shadow-lg",children:((Me=(Ce=a.appointment.technical)==null?void 0:Ce.name)==null?void 0:Me.charAt(0))||"N"}),e.jsx("p",{className:"font-bold text-purple-900",children:((Se=a.appointment.technical)==null?void 0:Se.name)||"Not assigned"}),((De=a.appointment.technical)==null?void 0:De.email)&&e.jsx("p",{className:"text-sm text-purple-700 mt-1",children:a.appointment.technical.email})]})]})}),e.jsx("div",{className:"group",children:e.jsxs("div",{className:"bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-100 hover:shadow-lg transition-all duration-300 h-full",children:[e.jsx("div",{className:"flex items-center gap-4 mb-4",children:e.jsx("h3",{className:"text-lg font-bold text-orange-900",children:"Client"})}),e.jsxs("div",{className:"text-center",children:[(_e=(Ee=(Ae=a.appointment.ticket)==null?void 0:Ae.user)==null?void 0:Ee.tenant)!=null&&_e.photo?e.jsx("img",{src:`/storage/${a.appointment.ticket.user.tenant.photo}`,alt:a.appointment.ticket.user.name,className:"w-16 h-16 mx-auto mb-3 rounded-full object-cover shadow-lg border-2 border-orange-200"}):e.jsx("div",{className:"w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-bold text-xl shadow-lg",children:(($e=(ze=(Te=a.appointment.ticket)==null?void 0:Te.user)==null?void 0:ze.name)==null?void 0:$e.charAt(0))||"C"}),e.jsx("p",{className:"font-bold text-orange-900",children:((Ye=(Le=a.appointment.ticket)==null?void 0:Le.user)==null?void 0:Ye.name)||"Client"}),((He=(Be=a.appointment.ticket)==null?void 0:Be.user)==null?void 0:He.email)&&e.jsx("p",{className:"text-sm text-orange-700 mt-1 break-all",children:a.appointment.ticket.user.email})]})]})})]}),e.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6",children:[e.jsxs("div",{className:"bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 border border-indigo-100 hover:shadow-lg transition-all duration-300",children:[e.jsxs("div",{className:"flex items-center gap-4 mb-4",children:[e.jsx("div",{className:"p-3 bg-indigo-500 rounded-xl shadow-lg",children:e.jsx("svg",{className:"w-6 h-6 text-white",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"})})}),e.jsx("h3",{className:"text-lg font-bold text-indigo-900",children:"Ticket"})]}),e.jsxs("div",{className:"text-center",children:[e.jsxs("p",{className:"text-2xl font-bold text-indigo-900 mb-1",children:["#",((Fe=a.appointment.ticket)==null?void 0:Fe.code)||"N/A"]}),e.jsx("p",{className:"text-sm text-indigo-700",children:((We=a.appointment.ticket)==null?void 0:We.title)||"Ticket relacionado"})]})]}),e.jsxs("div",{className:"bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl p-6 border border-slate-100 hover:shadow-lg transition-all duration-300",children:[e.jsxs("div",{className:"flex items-center gap-4 mb-4",children:[e.jsx("div",{className:"p-3 bg-slate-500 rounded-xl shadow-lg",children:e.jsx("svg",{className:"w-6 h-6 text-white",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"})})}),e.jsx("h3",{className:"text-lg font-bold text-slate-900",children:"Details"})]}),e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{className:"text-center",children:[e.jsx("p",{className:"text-sm text-slate-600 mb-1",children:"Status"}),ge(a.appointment.status)]}),a.appointment.notes&&e.jsxs("div",{className:"bg-white rounded-lg p-3 border border-slate-200",children:[e.jsx("p",{className:"text-xs text-slate-500 mb-1",children:"Notes"}),e.jsx("p",{className:"text-sm text-slate-700",children:a.appointment.notes})]})]})]}),e.jsxs("div",{className:"bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-6 border border-teal-100 hover:shadow-lg transition-all duration-300",children:[e.jsxs("div",{className:"flex items-center gap-4 mb-4",children:[e.jsx("div",{className:"p-3 bg-teal-500 rounded-xl shadow-lg",children:e.jsx(te,{className:"w-6 h-6 text-white"})}),e.jsx("h3",{className:"text-lg font-bold text-teal-900",children:"Times"})]}),e.jsxs("div",{className:"space-y-3",children:[a.appointment.started_at&&e.jsxs("div",{className:"bg-white rounded-lg p-3 border border-teal-200",children:[e.jsx("p",{className:"text-xs text-teal-600 mb-1",children:"Started"}),e.jsx("p",{className:"text-sm font-medium text-teal-800",children:new Date(a.appointment.started_at).toLocaleString()})]}),a.appointment.completed_at&&e.jsxs("div",{className:"bg-white rounded-lg p-3 border border-teal-200",children:[e.jsx("p",{className:"text-xs text-teal-600 mb-1",children:"Completed"}),e.jsx("p",{className:"text-sm font-medium text-teal-800",children:new Date(a.appointment.completed_at).toLocaleString()})]}),a.appointment.rating&&e.jsxs("div",{className:"bg-white rounded-lg p-3 border border-teal-200",children:[e.jsx("p",{className:"text-xs text-teal-600 mb-1",children:"Rating"}),e.jsx("div",{className:"flex items-center gap-1",children:[...Array(5)].map((t,r)=>e.jsx("svg",{className:`w-4 h-4 ${r<a.appointment.rating?"text-yellow-400":"text-gray-300"}`,fill:"currentColor",viewBox:"0 0 20 20",children:e.jsx("path",{d:"M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"})},r))})]}),!a.appointment.started_at&&!a.appointment.completed_at&&!a.appointment.rating&&e.jsxs("div",{className:"text-center py-4",children:[e.jsx("div",{className:"p-3 bg-teal-100 rounded-full w-fit mx-auto mb-3",children:e.jsx("svg",{className:"w-6 h-6 text-teal-600",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"})})}),e.jsx("p",{className:"text-xs text-teal-600 opacity-80",children:"The appointment has not started yet"})]})]})]})]})]})]}),e.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-2 gap-6",children:[a.appointment.description&&e.jsx("div",{className:"lg:col-span-2",children:e.jsxs("div",{className:"bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-slate-200/60",children:[e.jsxs("div",{className:"flex items-center gap-3 mb-4",children:[e.jsx("div",{className:"p-2 bg-slate-100 rounded-xl",children:e.jsx("svg",{className:"w-5 h-5 text-slate-600",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"})})}),e.jsx("h3",{className:"text-lg font-bold text-slate-900",children:"Description"})]}),e.jsx("div",{className:"bg-gradient-to-r from-slate-50 to-white rounded-xl p-4 border border-slate-100",children:e.jsx("p",{className:"text-slate-800 leading-relaxed",children:a.appointment.description})})]})}),a.appointment.member_instructions&&e.jsx("div",{className:a.appointment.completion_notes?"lg:col-span-1":"lg:col-span-2",children:e.jsxs("div",{className:"bg-gradient-to-br from-blue-50 via-blue-50 to-indigo-50 rounded-2xl p-6 shadow-lg border border-blue-200/60 h-full",children:[e.jsxs("div",{className:"flex items-center gap-3 mb-4",children:[e.jsx("div",{className:"p-2 bg-blue-500 rounded-xl shadow-md",children:e.jsx("svg",{className:"w-5 h-5 text-white",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"})})}),e.jsx("h3",{className:"text-lg font-bold text-blue-900",children:"Instructions"})]}),e.jsx("div",{className:"bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-blue-200/40",children:e.jsx("p",{className:"text-blue-800 leading-relaxed",children:a.appointment.member_instructions})})]})}),a.appointment.completion_notes&&e.jsx("div",{className:"lg:col-span-1",children:e.jsxs("div",{className:"bg-gradient-to-br from-green-50 via-green-50 to-emerald-50 rounded-2xl p-6 shadow-lg border border-green-200/60 h-full",children:[e.jsxs("div",{className:"flex items-center gap-3 mb-4",children:[e.jsx("div",{className:"p-2 bg-green-500 rounded-xl shadow-md",children:e.jsx("svg",{className:"w-5 h-5 text-white",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"})})}),e.jsx("h3",{className:"text-lg font-bold text-green-900",children:"Completion Notes"})]}),e.jsx("div",{className:"bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-green-200/40",children:e.jsx("p",{className:"text-green-800 leading-relaxed",children:a.appointment.completion_notes})})]})})]}),(j||w||Ke)&&a.appointment.status==="scheduled"&&e.jsxs("div",{className:"relative bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl p-8 shadow-2xl overflow-hidden",children:[e.jsx("div",{className:"absolute inset-0 bg-black/10"}),e.jsx("div",{className:"absolute top-0 left-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 -translate-x-20"}),e.jsx("div",{className:"absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-y-16 translate-x-16"}),e.jsxs("div",{className:"relative z-10",children:[e.jsxs("div",{className:"flex items-center gap-4 mb-6",children:[e.jsx("div",{className:"p-3 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg",children:e.jsx(q,{className:"w-7 h-7 text-white"})}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-2xl font-bold text-white mb-1",children:"Visit Actions"}),e.jsx("p",{className:"text-white/80",children:"Start your visit or mark as no show"})]})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:[e.jsxs(h,{onClick:()=>{xe("start",a.appointment.id),N({open:!1})},className:"group relative bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 px-6 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 border-0",children:[e.jsx("div",{className:"absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"}),e.jsxs("div",{className:"relative flex items-center justify-center gap-3",children:[e.jsx(q,{className:"w-6 h-6"}),"Start Visit"]})]}),e.jsx(h,{onClick:()=>{F({open:!0,appointment:a.appointment}),N({open:!1})},className:"group relative bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white py-4 px-6 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 border border-white/30 hover:border-white/50",children:e.jsxs("div",{className:"relative flex items-center justify-center gap-3",children:[e.jsx(G,{className:"w-6 h-6"}),"Mark No Show"]})})]})]})]})]})}),e.jsxs("div",{className:"flex items-center justify-between pt-6 border-t border-slate-200/60 bg-gradient-to-r from-slate-50 to-white -mx-6 -mb-6 px-8 py-6 rounded-b-lg",children:[e.jsxs("div",{className:"text-sm text-slate-600",children:[e.jsx("span",{className:"font-medium",children:"Appointment created:"})," ",new Date(((Ie=a.appointment)==null?void 0:Ie.created_at)||"").toLocaleDateString()]}),e.jsxs("div",{className:"flex gap-3",children:[e.jsx(h,{variant:"outline",onClick:()=>{var t,r;return window.location.href=`/tickets?ticket=${(r=(t=a.appointment)==null?void 0:t.ticket)==null?void 0:r.id}`},className:"px-6 py-2 border-slate-300 text-slate-700 hover:bg-slate-50",children:"View Full Ticket"}),e.jsx(h,{onClick:()=>N({open:!1}),className:"px-8 py-2 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white",children:"Close"})]})]})]})}),e.jsx(U,{open:H.open,onOpenChange:t=>ce({open:t}),children:e.jsxs(R,{className:"sm:max-w-[800px]",children:[e.jsx(P,{children:e.jsxs(O,{className:"flex items-center gap-2",children:[e.jsx(re,{className:"w-5 h-5 text-red-600"}),((Ve=H.building)==null?void 0:Ve.name)||"Building Location"]})}),e.jsx("div",{className:"w-full aspect-video",children:e.jsx("iframe",{src:(Ue=H.building)!=null&&Ue.location_link?Qe(H.building.location_link):"",width:"100%",height:"100%",style:{border:0},allowFullScreen:!0,loading:"lazy",referrerPolicy:"no-referrer-when-downgrade",title:"Building Location"})})]})}),e.jsx(U,{open:X.open,onOpenChange:t=>F({open:t}),children:e.jsxs(R,{className:"sm:max-w-md",children:[e.jsx(P,{children:e.jsxs(O,{className:"flex items-center gap-2",children:[e.jsx(G,{className:"w-5 h-5 text-orange-600"}),"Mark as No Show"]})}),e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-2",children:"Reason for No Show *"}),e.jsxs("select",{value:k.reason,onChange:t=>W({...k,reason:t.target.value}),className:"w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500",required:!0,children:[e.jsx("option",{value:"",children:"Select a reason"}),Je.map(t=>e.jsx("option",{value:t.value,children:t.label},t.value))]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-2",children:"Additional Description (Optional)"}),e.jsx("textarea",{value:k.description,onChange:t=>W({...k,description:t.target.value}),placeholder:"Enter additional details about the no-show...",className:"w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500",rows:3})]})]}),e.jsxs("div",{className:"flex gap-3 mt-6",children:[e.jsx(h,{variant:"outline",onClick:()=>{F({open:!1}),W({reason:"",description:"",notifyMember:!0,rescheduleOffered:!1})},className:"flex-1",disabled:J,children:"Cancel"}),e.jsx(h,{onClick:ot,disabled:!k.reason||J,className:"flex-1 bg-orange-600 hover:bg-orange-700 text-white",children:J?"Processing...":"Mark as No Show"})]})]})}),e.jsx(U,{open:i.open,onOpenChange:t=>I({open:t}),children:e.jsxs(R,{className:"sm:max-w-md",children:[e.jsx(P,{children:e.jsx(O,{className:"flex items-center gap-3",children:e.jsxs("div",{children:[e.jsx("div",{className:"text-lg font-bold",children:i.type==="technical"?"Technical":"Client"}),e.jsx("div",{className:"text-sm font-normal text-slate-600",children:"Contact Information"})]})})}),i.user&&e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"flex items-center gap-4 p-4 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-200",children:[e.jsxs("div",{className:"relative w-16 h-16 rounded-full border-2 border-white shadow-md overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200",children:[(()=>{const t=i.user.photo||i.user.photo_url||i.user.avatar_url||i.user.avatar||null;if(!!t){const s=t.startsWith("/storage/")||t.startsWith("http")?t:`/storage/${t}`;return e.jsx("img",{src:s,alt:i.user.name||"User photo",className:"w-full h-full object-cover",onError:n=>{n.currentTarget.style.display="none";const o=n.currentTarget.nextElementSibling;o&&(o.style.display="flex")}})}return null})(),e.jsx("div",{className:`absolute inset-0 w-full h-full ${i.type==="technical"?"bg-gradient-to-br from-blue-500 to-blue-600":"bg-gradient-to-br from-green-500 to-green-600"} flex items-center justify-center text-white font-bold text-lg`,style:{display:!!(i.user.photo||i.user.photo_url||i.user.avatar_url||i.user.avatar)?"none":"flex"},children:(()=>{var s,n;const t=i.user.name||"";if(!t)return"?";const r=t.trim().split(" ");return r.length===1?((s=r[0][0])==null?void 0:s.toUpperCase())||"?":(r[0][0]+(((n=r[1])==null?void 0:n[0])||"")).toUpperCase()})()})]}),e.jsxs("div",{className:"flex-1",children:[e.jsx("h3",{className:"font-bold text-xl text-slate-900 mb-1",children:i.user.name||"Sin nombre"}),e.jsx("p",{className:"text-sm text-slate-600 font-medium",children:i.type==="technical"?"Technical Support":"Client"})]})]}),e.jsxs("div",{className:"space-y-3",children:[i.user.email&&e.jsxs("div",{className:"flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-100 hover:shadow-md transition-shadow",children:[e.jsx("div",{className:"p-2 bg-blue-50 rounded-lg",children:e.jsx("svg",{className:"w-4 h-4 text-blue-600",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"})})}),e.jsxs("div",{className:"flex-1",children:[e.jsx("div",{className:"text-sm font-medium text-slate-700",children:"Correo Electrónico"}),e.jsx("div",{className:"text-sm text-slate-900 break-all",children:i.user.email})]}),e.jsx("button",{onClick:()=>window.open(`mailto:${i.user.email}`),className:"p-1 hover:bg-blue-100 rounded text-blue-600 transition-colors",title:"Enviar email",children:e.jsx("svg",{className:"w-4 h-4",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2M14 4h6m0 0v6m0-6L10 14"})})})]}),i.user.phone&&e.jsxs("div",{className:"flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-100 hover:shadow-md transition-shadow",children:[e.jsx("div",{className:"p-2 bg-green-50 rounded-lg",children:e.jsx("svg",{className:"w-4 h-4 text-green-600",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"})})}),e.jsxs("div",{className:"flex-1",children:[e.jsx("div",{className:"text-sm font-medium text-slate-700",children:"Teléfono"}),e.jsx("div",{className:"text-sm text-slate-900",children:i.user.phone})]}),e.jsx("button",{onClick:()=>window.open(`tel:${i.user.phone}`),className:"p-1 hover:bg-green-100 rounded text-green-600 transition-colors",title:"Llamar",children:e.jsx("svg",{className:"w-4 h-4",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2M14 4h6m0 0v6m0-6L10 14"})})})]}),i.type==="technical"&&i.user.specialization&&e.jsxs("div",{className:"flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-100",children:[e.jsx("div",{className:"p-2 bg-purple-50 rounded-lg",children:e.jsx("svg",{className:"w-4 h-4 text-purple-600",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"})})}),e.jsxs("div",{className:"flex-1",children:[e.jsx("div",{className:"text-sm font-medium text-slate-700",children:"Especialización"}),e.jsx("div",{className:"text-sm text-slate-900",children:i.user.specialization})]})]}),!i.user.email&&!i.user.phone&&e.jsxs("div",{className:"text-center py-6",children:[e.jsx("div",{className:"p-3 bg-slate-100 rounded-full w-fit mx-auto mb-2",children:e.jsx("svg",{className:"w-6 h-6 text-slate-400",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"})})}),e.jsx("p",{className:"text-sm text-slate-500 font-medium",children:"No hay información de contacto disponible"})]})]})]}),e.jsx("div",{className:"flex justify-end mt-6",children:e.jsx(h,{onClick:()=>I({open:!1}),className:"px-6",children:"Cerrar"})})]})})]})]})}export{Qt as default};
