import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Filter, 
  Search 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Define lead statuses and their colors
const leadStatuses = {
  new: {
    name: "New",
    color: "bg-blue-100 text-blue-800 hover:bg-blue-200",
  },
  contacted: {
    name: "Contacted",
    color: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
  },
  won: {
    name: "Won",
    color: "bg-green-100 text-green-800 hover:bg-green-200",
  },
  lost: {
    name: "Lost",
    color: "bg-red-100 text-red-800 hover:bg-red-200",
  },
};

// Define lead type
interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  status: keyof typeof leadStatuses;
  value: number;
  source: string;
  date: Date;
  notes: string;
}

export default function Leads() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<keyof typeof leadStatuses | "all">("all");
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  
  // Fetch leads data
  const { data, isLoading } = useQuery({
    queryKey: ['/api/leads', searchQuery, filter],
    staleTime: 60 * 1000, // 1 minute
  });
  
  // Sample leads data
  const leadsData: Lead[] = [
    {
      id: "LEAD-001",
      name: "Michael Rodriguez",
      email: "m.rodriguez@example.com",
      company: "Tech Solutions Inc.",
      status: "new",
      value: 5000,
      source: "Website Form",
      date: new Date(2023, 5, 20),
      notes: "Interested in enterprise plan.",
    },
    {
      id: "LEAD-002",
      name: "Sarah Johnson",
      email: "sjohnson@example.com",
      company: "Creative Studios",
      status: "new",
      value: 3000,
      source: "LinkedIn",
      date: new Date(2023, 5, 19),
      notes: "Requesting demo of the platform.",
    },
    {
      id: "LEAD-003",
      name: "David Campbell",
      email: "dcampbell@example.com",
      company: "Global Retailers",
      status: "contacted",
      value: 8500,
      source: "Referral",
      date: new Date(2023, 5, 15),
      notes: "Had initial call, scheduling follow-up next week.",
    },
    {
      id: "LEAD-004",
      name: "Jessica Martinez",
      email: "jmartinez@example.com",
      company: "Martinez & Co.",
      status: "contacted",
      value: 4200,
      source: "Trade Show",
      date: new Date(2023, 5, 10),
      notes: "Sent proposal, awaiting feedback.",
    },
    {
      id: "LEAD-005",
      name: "Thomas Wilson",
      email: "twilson@example.com",
      company: "Wilson Enterprises",
      status: "won",
      value: 12000,
      source: "Webinar",
      date: new Date(2023, 5, 5),
      notes: "Contract signed, implementation starting next month.",
    },
    {
      id: "LEAD-006",
      name: "Emily Brown",
      email: "ebrown@example.com",
      company: "Brown Industries",
      status: "lost",
      value: 6800,
      source: "Email Campaign",
      date: new Date(2023, 5, 1),
      notes: "Went with competitor due to budget constraints.",
    },
  ];
  
  // Filter leads by status and search query
  const getFilteredLeads = (status: keyof typeof leadStatuses | "all") => {
    const filtered = leadsData.filter((lead) => {
      // Filter by status if not 'all'
      const statusMatch = status === "all" || lead.status === status;
      
      // Filter by search query
      const searchMatch = 
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.company.toLowerCase().includes(searchQuery.toLowerCase());
      
      return statusMatch && searchMatch;
    });
    
    return filtered;
  };
  
  // Handle drag start event
  const handleDragStart = (lead: Lead) => {
    setDraggedLead(lead);
  };
  
  // Handle drag over event
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  
  // Handle drop event
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, newStatus: keyof typeof leadStatuses) => {
    e.preventDefault();
    
    if (draggedLead && draggedLead.status !== newStatus) {
      // In a real app, this would update the status in the database
      console.log(`Changed status of ${draggedLead.id} from ${draggedLead.status} to ${newStatus}`);
      
      // Reset dragged lead
      setDraggedLead(null);
    }
  };
  
  // Lead card component
  const LeadCard = ({ lead }: { lead: Lead }) => (
    <div
      className="p-4 mb-2 bg-white rounded-lg shadow cursor-move"
      draggable
      onDragStart={() => handleDragStart(lead)}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-medium text-gray-900">{lead.name}</h3>
          <p className="text-sm text-gray-500">{lead.company}</p>
        </div>
        <Badge variant="outline" className={leadStatuses[lead.status].color}>
          {leadStatuses[lead.status].name}
        </Badge>
      </div>
      <div className="mt-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Value:</span>
          <span className="font-medium">${lead.value.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Source:</span>
          <span>{lead.source}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Date:</span>
          <span>{lead.date.toLocaleDateString()}</span>
        </div>
      </div>
      <div className="mt-3 text-xs italic text-gray-500">
        {lead.notes}
      </div>
      <div className="mt-3 flex justify-end">
        <Button variant="ghost" size="sm">
          View Details
        </Button>
      </div>
    </div>
  );
  
  // Render kanban column for each status
  const renderKanbanColumn = (status: keyof typeof leadStatuses) => {
    const statusInfo = leadStatuses[status];
    const filteredLeads = getFilteredLeads(filter === "all" ? status : filter);
    
    return (
      <div className="flex flex-col min-w-[280px] w-full">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <Badge className={statusInfo.color}>{statusInfo.name}</Badge>
            <span className="ml-2 text-sm text-gray-500">
              {filteredLeads.filter(lead => lead.status === status).length}
            </span>
          </div>
          <Button variant="ghost" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
        <div
          className="flex-1 p-3 bg-gray-100 rounded-lg min-h-[500px]"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, status)}
        >
          {filteredLeads
            .filter(lead => lead.status === status)
            .map(lead => (
              <LeadCard key={lead.id} lead={lead} />
            ))}
        </div>
      </div>
    );
  };
  
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Lead Management</h1>
        <Button>
          <Plus className="h-4 w-4 mr-1" />
          New Lead
        </Button>
      </div>
      
      <div className="mb-6 flex flex-col sm:flex-row gap-4 sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            className="pl-9"
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-1" />
              Filter: {filter === "all" ? "All Statuses" : leadStatuses[filter].name}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setFilter("all")}>
              All Statuses
            </DropdownMenuItem>
            {Object.entries(leadStatuses).map(([key, value]) => (
              <DropdownMenuItem 
                key={key}
                onClick={() => setFilter(key as keyof typeof leadStatuses)}
              >
                {value.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="overflow-x-auto pb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 min-w-[1100px]">
          {renderKanbanColumn("new")}
          {renderKanbanColumn("contacted")}
          {renderKanbanColumn("won")}
          {renderKanbanColumn("lost")}
        </div>
      </div>
    </div>
  );
}
