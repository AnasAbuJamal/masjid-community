"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, X, Filter, User, GraduationCap, FileText, Briefcase, Users, Lightbulb, HardHat, Calendar, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface SearchResult {
    type: string;
    id: string;
    title: string;
    subtitle: string;
    link: string;
}

const typeConfig: Record<string, { icon: React.ElementType; color: string; href: string }> = {
    user: { icon: User, color: "bg-purple-100 text-purple-700", href: "/dashboard/users" },
    student: { icon: GraduationCap, color: "bg-blue-100 text-blue-700", href: "/dashboard/classroom" },
    blog: { icon: FileText, color: "bg-green-100 text-green-700", href: "/dashboard/blog" },
    job: { icon: Briefcase, color: "bg-orange-100 text-orange-700", href: "/dashboard/jobs" },
    worker: { icon: Users, color: "bg-teal-100 text-teal-700", href: "/dashboard/workers" },
    proposal: { icon: Lightbulb, color: "bg-yellow-100 text-yellow-700", href: "/dashboard/proposals" },
    volunteer: { icon: Calendar, color: "bg-pink-100 text-pink-700", href: "/dashboard/volunteers" },
    construction: { icon: HardHat, color: "bg-amber-100 text-amber-700", href: "/dashboard/construction" },
    class: { icon: GraduationCap, color: "bg-indigo-100 text-indigo-700", href: "/dashboard/classroom" },
};

export default function SearchPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get("q") || "";
    
    const [query, setQuery] = useState(initialQuery);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [searched, setSearched] = useState(false);
    const [typeCounts, setTypeCounts] = useState<Record<string, number>>({});
    const [selectedTypes, setSelectedTypes] = useState<string[]>(["all"]);

    const performSearch = useCallback(async (searchQuery: string, types: string[]) => {
        if (searchQuery.length < 2) return;
        
        setLoading(true);
        setSearched(true);
        
        try {
            const typeParam = types.includes("all") ? "all" : types.join(",");
            const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&types=${typeParam}`);
            const data = await res.json();
            
            setResults(data.results || []);
            setTotal(data.total || 0);
            setTypeCounts(data.types || {});
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (initialQuery) {
            performSearch(initialQuery, selectedTypes);
        }
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.length >= 2) {
            router.push(`/dashboard/search?q=${encodeURIComponent(query)}`);
            performSearch(query, selectedTypes);
        }
    };

    const handleTypeToggle = (type: string) => {
        let newTypes: string[];
        if (type === "all") {
            newTypes = ["all"];
        } else {
            newTypes = selectedTypes.filter((t) => t !== "all");
            if (newTypes.includes(type)) {
                newTypes = newTypes.filter((t) => t !== type);
                if (newTypes.length === 0) newTypes = ["all"];
            } else {
                newTypes.push(type);
            }
        }
        setSelectedTypes(newTypes);
        if (query.length >= 2) {
            performSearch(query, newTypes);
        }
    };

    const clearSearch = () => {
        setQuery("");
        setResults([]);
        setTotal(0);
        setSearched(false);
        router.push("/dashboard/search");
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Global Search</h1>
                <p className="text-gray-500 mt-1">Search across all content types</p>
            </div>

            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Search users, students, posts, jobs, and more..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="pl-10 h-12 text-lg"
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={clearSearch}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
                        >
                            <X className="h-4 w-4 text-gray-400" />
                        </button>
                    )}
                </div>
                <Button type="submit" size="lg" disabled={query.length < 2 || loading} className="h-12 px-8">
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Search"}
                </Button>
            </form>

            {searched && (
                <>
                    <div className="flex flex-wrap gap-2">
                        <div className="flex items-center gap-2 mr-4">
                            <Filter className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-500">Filter by type:</span>
                        </div>
                        {["all", "user", "student", "blog", "job", "worker", "proposal", "volunteer", "construction", "class"].map((type) => {
                            const isActive = selectedTypes.includes(type);
                            const config = typeConfig[type];
                            const Icon = config?.icon || Search;
                            const label = type === "all" ? `All (${total})` : `${type.charAt(0).toUpperCase() + type.slice(1)} (${typeCounts[type] || 0})`;
                            
                            return (
                                <button
                                    key={type}
                                    onClick={() => handleTypeToggle(type)}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                                        isActive
                                            ? "bg-mocha-900 text-white"
                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    )}
                                >
                                    {type !== "all" && <Icon className="h-3.5 w-3.5" />}
                                    {label}
                                </button>
                            );
                        })}
                    </div>

                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle>
                                    {loading ? "Searching..." : `Results for "${query}"`}
                                </CardTitle>
                                {!loading && (
                                    <Badge variant="secondary">{total} result{total !== 1 ? "s" : ""}</Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-mocha-600" />
                                </div>
                            ) : results.length === 0 ? (
                                <div className="text-center py-12">
                                    <Search className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                                    <p className="text-gray-500">No results found for &quot;{query}&quot;</p>
                                    <p className="text-sm text-gray-400 mt-1">Try different keywords or remove filters</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {results.map((result) => {
                                        const config = typeConfig[result.type] || { icon: Search, color: "bg-gray-100 text-gray-700" };
                                        const Icon = config.icon;
                                        
                                        return (
                                            <Link
                                                key={`${result.type}-${result.id}`}
                                                href={result.link}
                                                className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors group"
                                            >
                                                <div className={cn("flex items-center justify-center w-10 h-10 rounded-lg", config.color)}>
                                                    <Icon className="h-5 w-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-gray-900 group-hover:text-mocha-700 truncate">
                                                        {result.title}
                                                    </p>
                                                    <p className="text-sm text-gray-500 truncate">{result.subtitle}</p>
                                                </div>
                                                <Badge variant="outline" className="capitalize">
                                                    {result.type}
                                                </Badge>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}

            {!searched && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
                    <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setQuery(""); router.push("/dashboard/users"); }}>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                                <User className="h-6 w-6 text-purple-700" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Users</h3>
                                <p className="text-sm text-gray-500">Search staff accounts</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setQuery(""); router.push("/dashboard/classroom"); }}>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                <GraduationCap className="h-6 w-6 text-blue-700" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Students</h3>
                                <p className="text-sm text-gray-500">Search school students</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setQuery(""); router.push("/dashboard/blog"); }}>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                                <FileText className="h-6 w-6 text-green-700" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Blog Posts</h3>
                                <p className="text-sm text-gray-500">Search news articles</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setQuery(""); router.push("/dashboard/jobs"); }}>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                                <Briefcase className="h-6 w-6 text-orange-700" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Jobs</h3>
                                <p className="text-sm text-gray-500">Search job postings</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setQuery(""); router.push("/dashboard/workers"); }}>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
                                <Users className="h-6 w-6 text-teal-700" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Workers</h3>
                                <p className="text-sm text-gray-500">Search worker profiles</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setQuery(""); router.push("/dashboard/proposals"); }}>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                                <Lightbulb className="h-6 w-6 text-yellow-700" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Proposals</h3>
                                <p className="text-sm text-gray-500">Search community proposals</p>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
