"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { ClipboardList, Check, X, Eye, Clock, Calendar, DollarSign, Package } from "lucide-react";

interface RentalBooking {
  id: string;
  itemId: string;
  renterName: string;
  renterEmail: string;
  renterPhone: string;
  eventName: string | null;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: string;
  adminNotes: string | null;
  createdAt: string;
  item: { name: string; category: string };
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  completed: "bg-blue-100 text-blue-700",
  cancelled: "bg-gray-100 text-gray-700",
};

export default function RentalBookingsPage() {
  const [bookings, setBookings] = useState<RentalBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [detailBooking, setDetailBooking] = useState<RentalBooking | null>(null);
  const [reviewDialog, setReviewDialog] = useState(false);
  const [reviewAction, setReviewAction] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchBookings = async () => {
    try {
      const url = filter === "all" ? "/api/rentals/bookings" : `/api/rentals/bookings?status=${filter}`;
      const res = await fetch(url);
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch { /* empty */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchBookings(); }, [filter]);

  const handleReview = (booking: RentalBooking, action: string) => {
    setDetailBooking(booking);
    setReviewAction(action);
    setAdminNotes("");
    setReviewDialog(true);
  };

  const submitReview = async () => {
    if (!detailBooking || !reviewAction) return;
    setSaving(true);
    try {
      await fetch(`/api/rentals/bookings/${detailBooking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: reviewAction, adminNotes }),
      });
      setReviewDialog(false);
      fetchBookings();
    } catch { /* empty */ } finally { setSaving(false); }
  };

  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const approvedCount = bookings.filter((b) => b.status === "approved").length;
  const rejectedCount = bookings.filter((b) => b.status === "rejected").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-gray-900">Rental Bookings</h1><p className="text-gray-500 mt-1">Review and manage rental requests</p></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Total Bookings</p><p className="text-3xl font-bold">{bookings.length}</p></div><div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center"><ClipboardList className="h-6 w-6 text-blue-600" /></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Pending</p><p className="text-3xl font-bold text-yellow-600">{pendingCount}</p></div><div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center"><Clock className="h-6 w-6 text-yellow-600" /></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Approved</p><p className="text-3xl font-bold text-green-600">{approvedCount}</p></div><div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center"><Check className="h-6 w-6 text-green-600" /></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Rejected</p><p className="text-3xl font-bold text-red-600">{rejectedCount}</p></div><div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center"><X className="h-6 w-6 text-red-600" /></div></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Booking Requests</CardTitle>
          <select className="border rounded-md px-3 py-2 text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="completed">Completed</option>
          </select>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No bookings found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Renter</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell><div className="flex items-center gap-2"><Package className="h-4 w-4 text-gray-400" />{booking.item.name}</div></TableCell>
                    <TableCell>
                      <div>{booking.renterName}</div>
                      <div className="text-xs text-gray-500">{booking.renterEmail}</div>
                    </TableCell>
                    <TableCell>{booking.eventName || "—"}</TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}</div>
                    </TableCell>
                    <TableCell className="font-medium">${booking.totalPrice.toFixed(2)}</TableCell>
                    <TableCell><Badge className={statusColors[booking.status]}>{booking.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setDetailBooking(booking)}><Eye className="h-4 w-4" /></Button>
                        {booking.status === "pending" && (
                          <>
                            <Button size="sm" variant="ghost" className="text-green-600" onClick={() => handleReview(booking, "approve")}><Check className="h-4 w-4" /></Button>
                            <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleReview(booking, "reject")}><X className="h-4 w-4" /></Button>
                          </>
                        )}
                        {booking.status === "approved" && (
                          <Button size="sm" variant="ghost" className="text-blue-600" onClick={() => handleReview(booking, "complete")}><Check className="h-4 w-4" /></Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!detailBooking && !reviewDialog} onOpenChange={(open) => !open && setDetailBooking(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Booking Details</DialogTitle></DialogHeader>
          {detailBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-gray-500">Item</p><p className="font-medium">{detailBooking.item.name}</p></div>
                <div><p className="text-sm text-gray-500">Status</p><Badge className={statusColors[detailBooking.status]}>{detailBooking.status}</Badge></div>
                <div><p className="text-sm text-gray-500">Renter Name</p><p className="font-medium">{detailBooking.renterName}</p></div>
                <div><p className="text-sm text-gray-500">Renter Email</p><p className="font-medium">{detailBooking.renterEmail}</p></div>
                <div><p className="text-sm text-gray-500">Renter Phone</p><p className="font-medium">{detailBooking.renterPhone}</p></div>
                <div><p className="text-sm text-gray-500">Event Name</p><p className="font-medium">{detailBooking.eventName || "—"}</p></div>
                <div><p className="text-sm text-gray-500">Start Date</p><p className="font-medium">{new Date(detailBooking.startDate).toLocaleString()}</p></div>
                <div><p className="text-sm text-gray-500">End Date</p><p className="font-medium">{new Date(detailBooking.endDate).toLocaleString()}</p></div>
                <div><p className="text-sm text-gray-500">Total Price</p><p className="font-medium text-green-600">${detailBooking.totalPrice.toFixed(2)}</p></div>
                {detailBooking.adminNotes && <div className="col-span-2"><p className="text-sm text-gray-500">Admin Notes</p><p className="font-medium">{detailBooking.adminNotes}</p></div>}
              </div>
              {detailBooking.status === "pending" && (
                <div className="flex gap-2 pt-4">
                  <Button className="flex-1 bg-green-600" onClick={() => handleReview(detailBooking, "approve")}><Check className="h-4 w-4 mr-2" />Approve</Button>
                  <Button className="flex-1 bg-red-600" onClick={() => handleReview(detailBooking, "reject")}><X className="h-4 w-4 mr-2" />Reject</Button>
                </div>
              )}
              {detailBooking.status === "approved" && (
                <Button className="w-full bg-blue-600" onClick={() => handleReview(detailBooking, "complete")}><Check className="h-4 w-4 mr-2" />Mark as Completed</Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={reviewDialog} onOpenChange={(open) => !open && setReviewDialog(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{reviewAction === "approve" ? "Approve" : reviewAction === "complete" ? "Complete" : "Reject"} Booking</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to {reviewAction} this booking?</p>
            <div>
              <label className="text-sm font-medium">Notes (optional)</label>
              <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Add any notes..." className="mt-1" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setReviewDialog(false)}>Cancel</Button>
              <Button className="flex-1 bg-emerald-600" onClick={submitReview} disabled={saving}>{saving ? "Saving..." : "Confirm"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}