"use client";

import { useCallback, useEffect, useState } from "react";
import { EnquiryTable } from "@/components/dashboard/enquiry-table";
import { SearchBar } from "@/components/dashboard/search-bar";
import { StatusFilter } from "@/components/dashboard/status-filter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const [enquiries, setEnquiries] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("unread");
  const [page, setPage] = useState(1);
  const limit = 20;

  const fetchEnquiries = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (search) params.set("search", search);
    params.set("sortBy", sortBy);
    params.set("page", String(page));
    params.set("limit", String(limit));

    try {
      const res = await fetch(`/api/enquiries?${params}`);
      const data = await res.json();
      setEnquiries(data.enquiries || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Failed to fetch enquiries:", error);
    } finally {
      setLoading(false);
    }
  }, [status, search, sortBy, page]);

  useEffect(() => {
    fetchEnquiries();
  }, [fetchEnquiries]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Inbox</h1>
        <div className="flex items-center gap-2">
          <Button
            variant={sortBy === "unread" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("unread")}
          >
            Unread First
          </Button>
          <Button
            variant={sortBy === "date" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("date")}
          >
            Latest
          </Button>
        </div>
      </div>

      <SearchBar value={search} onChange={setSearch} />
      <StatusFilter value={status} onChange={setStatus} />

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {total} enquir{total === 1 ? "y" : "ies"}
          </p>
          <EnquiryTable enquiries={enquiries} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
