"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, BookOpen, FileText } from "lucide-react";
import { KnowledgeEditModal } from "@/components/knowledge-edit-modal";
import { TemplateEditModal } from "@/components/template-edit-modal";

interface Props {
  knowledgeEntries: any[];
  templates: any[];
}

export function SystemIntelligenceView({ knowledgeEntries, templates }: Props) {
  const [filterType, setFilterType] = useState<"ALL" | "KNOWLEDGE" | "TEMPLATE">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const combined = [
    ...knowledgeEntries.map(k => ({ ...k, type: "KNOWLEDGE" })),
    ...templates.map(t => ({ ...t, type: "TEMPLATE", title: t.name, category: t.scenario_key }))
  ];

  const filtered = combined.filter(item => {
    const matchesType = filterType === "ALL" || item.type === filterType;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.content || item.body_text || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex gap-2 p-1 bg-muted rounded-lg">
          <Button 
            variant={filterType === "ALL" ? "secondary" : "ghost"} 
            size="sm" 
            onClick={() => setFilterType("ALL")}
            className="text-xs"
          >
            All Intelligence
          </Button>
          <Button 
            variant={filterType === "KNOWLEDGE" ? "secondary" : "ghost"} 
            size="sm" 
            onClick={() => setFilterType("KNOWLEDGE")}
            className="text-xs flex gap-2 items-center"
          >
            <BookOpen className="h-3 w-3" />
            Knowledge Base
          </Button>
          <Button 
            variant={filterType === "TEMPLATE" ? "secondary" : "ghost"} 
            size="sm" 
            onClick={() => setFilterType("TEMPLATE")}
            className="text-xs flex gap-2 items-center"
          >
            <FileText className="h-3 w-3" />
            Email Templates
          </Button>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search patterns..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background border-border"
          />
        </div>
      </div>

      <div className="vault-card rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Name / Title</TableHead>
              <TableHead>Scenario / Category</TableHead>
              <TableHead>Details</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  No matching intelligence records found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => (
                <TableRow key={item.id} className="group">
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tight ${
                      item.type === "KNOWLEDGE" ? "bg-blue-500/10 text-blue-500" : "bg-emerald-500/10 text-emerald-500"
                    }`}>
                      {item.type}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {item.title}
                    {item.is_default && <span className="ml-2 text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded">Default</span>}
                  </TableCell>
                  <TableCell>
                    <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {item.category}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {item.type === "KNOWLEDGE" ? item.tags?.join(", ") : `${item.language} | v${item.version}`}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {item.type === "KNOWLEDGE" ? (
                      <KnowledgeEditModal entry={item} />
                    ) : (
                      <TemplateEditModal template={item} />
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
