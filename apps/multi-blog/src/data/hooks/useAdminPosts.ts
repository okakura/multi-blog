// Hook for managing admin posts with SWR and API integration

import React, { useState } from "react";
import useSWR from "swr";
import {
	type AdminPost,
	adminApiService,
	type CreateDomainRequest,
	type CreatePostRequest,
	type Domain,
	type UpdateDomainRequest,
} from "@/data/services/adminApi";

// Cache key creator for admin posts
const createAdminCacheKey = {
	posts: (domain: string) => `admin-posts-${domain}`,
	post: (domain: string, id: number) => `admin-post-${domain}-${id}`,
};

export const useAdminPosts = (domain = "all", page = 1, limit = 10) => {
	const [isCreating, setIsCreating] = useState(false);
	const [isUpdating, setIsUpdating] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	// Fetch all admin posts
	const {
		data: postsResponse,
		error,
		isLoading,
		mutate,
	} = useSWR<AdminPost[]>(
		`${createAdminCacheKey.posts(domain)}-${page}-${limit}`,
		async () => {
			if (domain === "all") {
				// Use a single backend call instead of multiple frontend calls
				try {
					const response = await adminApiService.getPosts(page, limit, "all");
					console.log("useAdminPosts all domains response:", response); // Debug log
					return response.posts || [];
				} catch (err) {
					console.warn("Failed to fetch posts for all domains:", err);
					return [];
				}
			}
			// Fetch posts for specific domain
			const response = await adminApiService.getPosts(page, limit, domain);
			console.log("useAdminPosts single domain response:", response); // Debug log
			return response.posts || [];
		},
		{
			revalidateOnFocus: false,
			dedupingInterval: 30000, // Cache for 30 seconds
		},
	);

	const posts = Array.isArray(postsResponse) ? postsResponse : [];

	// Create a new post
	const createPost = async (
		postData: CreatePostRequest & { domain?: string },
	) => {
		setIsCreating(true);
		try {
			const newPost = await adminApiService.createPost(
				{
					title: postData.title,
					content: postData.content,
					category: postData.category,
					slug: postData.slug,
					status: postData.status || "draft",
				},
				postData.domain || domain,
			);

			// Optimistically update the cache
			if (posts.length >= 0) {
				mutate([newPost, ...posts], false);
			}

			// Revalidate to ensure consistency
			mutate();

			return newPost;
		} catch (error) {
			console.error("Failed to create post:", error);
			throw error;
		} finally {
			setIsCreating(false);
		}
	};

	// Update an existing post
	const updatePost = async (
		id: number,
		postData: Partial<CreatePostRequest>,
	) => {
		setIsUpdating(true);
		try {
			const updatedPost = await adminApiService.updatePost(
				id,
				postData,
				domain,
			);

			// Optimistically update the cache
			if (posts.length >= 0) {
				const updatedPosts = posts.map((post) =>
					post.id === id ? updatedPost : post,
				);
				mutate(updatedPosts, false);
			}

			// Revalidate to ensure consistency
			mutate();

			return updatedPost;
		} catch (error) {
			console.error("Failed to update post:", error);
			throw error;
		} finally {
			setIsUpdating(false);
		}
	};

	// Delete a post
	const deletePost = async (id: number) => {
		setIsDeleting(true);
		try {
			await adminApiService.deletePost(id, domain);

			// Optimistically update the cache
			if (posts.length >= 0) {
				const filteredPosts = posts.filter((post) => post.id !== id);
				mutate(filteredPosts, false);
			}

			// Revalidate to ensure consistency
			mutate();
		} catch (error) {
			console.error("Failed to delete post:", error);
			throw error;
		} finally {
			setIsDeleting(false);
		}
	};

	// Refresh posts
	const refresh = () => {
		mutate();
	};

	return {
		// Data
		posts: posts || [],

		// Loading states
		isLoading,
		isCreating,
		isUpdating,
		isDeleting,

		// Error state
		error: error?.message || null,

		// Actions
		createPost,
		updatePost,
		deletePost,
		refresh,

		// SWR utilities
		mutate,
	};
};

// Hook for a single admin post
export const useAdminPost = (domain: string, id: number) => {
	const {
		data: post,
		error,
		isLoading,
		mutate,
	} = useSWR<AdminPost>(
		id ? createAdminCacheKey.post(domain, id) : null,
		() => adminApiService.getPost(id, domain),
		{
			revalidateOnFocus: false,
			dedupingInterval: 60000, // Cache single posts for 1 minute
		},
	);

	return {
		post,
		isLoading,
		error: error?.message || null,
		mutate,
	};
};

// Hook for domain settings - requires specific domain
export const useAdminDomainSettings = (domain: string) => {
	const [isUpdating, setIsUpdating] = useState(false);

	const {
		data: settings,
		error,
		isLoading,
		mutate,
	} = useSWR(
		`admin-domain-settings-${domain}`,
		() => adminApiService.getDomainSettings(domain),
		{
			revalidateOnFocus: false,
			dedupingInterval: 60000,
		},
	);

	const updateSettings = async (newSettings: Record<string, unknown>) => {
		setIsUpdating(true);
		try {
			const updated = await adminApiService.updateDomainSettings(
				newSettings,
				domain,
			);
			mutate(updated, false);
			mutate();
			return updated;
		} catch (error) {
			console.error("Failed to update domain settings:", error);
			throw error;
		} finally {
			setIsUpdating(false);
		}
	};

	return {
		settings,
		isLoading,
		isUpdating,
		error: error?.message || null,
		updateSettings,
		refresh: mutate,
	};
};

// Analytics-specific hooks - optimized to avoid duplicate API calls
export const useAnalyticsOverview = (days = 30, domain?: string) => {
	const { data, error, isLoading, mutate } = useSWR(
		`analytics-overview-${days}-${domain || "all"}`,
		async () => {
			return await adminApiService.getAnalyticsOverview(days, domain);
		},
		{
			revalidateOnFocus: false,
			dedupingInterval: 10000, // 10 seconds deduplication
		},
	);

	return {
		overview: data,
		isLoading,
		error: error?.message || null,
		refresh: mutate,
	};
};

// Optimized admin analytics hook - reuses analytics overview data to prevent duplicates
export const useAdminAnalytics = (domain?: string) => {
	// Use the same analytics overview hook to prevent duplicate calls
	const { overview, isLoading, error, refresh } = useAnalyticsOverview(
		30,
		domain,
	);

	// Transform the overview data to match the expected analytics format
	const analytics = React.useMemo(() => {
		if (!overview) return null;

		return {
			total_posts: overview.current_period?.posts || 0,
			posts_this_month: overview.current_period?.posts || 0,
			active_domains: overview.active_domains || 3,
			total_views: overview.current_period?.page_views || 0,
			views_this_month: overview.current_period?.page_views || 0,
			comprehensive: overview,
			top_posts: overview.top_posts || [],
			top_categories: overview.top_categories || [],
			current_period: overview.current_period || null,
			previous_period: overview.previous_period || null,
		};
	}, [overview]);

	return {
		analytics,
		isLoading,
		error,
		refresh,
	};
};

export const useTrafficStats = (days = 30, domain?: string) => {
	const { data, error, isLoading, mutate } = useSWR(
		`traffic-stats-${days}-${domain || "all"}`,
		async () => {
			return await adminApiService.getTrafficAnalytics(days, domain);
		},
	);

	return {
		traffic: data,
		isLoading,
		error: error?.message || null,
		refresh: mutate,
	};
};

export const usePostAnalytics = (days = 30, domain?: string) => {
	const { data, error, isLoading, mutate } = useSWR(
		`post-analytics-${days}-${domain || "all"}`,
		async () => {
			return await adminApiService.getPostAnalytics(days, domain);
		},
	);

	return {
		postAnalytics: data,
		isLoading,
		error: error?.message || null,
		refresh: mutate,
	};
};

export const useSearchAnalytics = (days = 30, domain?: string) => {
	const { data, error, isLoading, mutate } = useSWR(
		`search-analytics-${days}-${domain || "all"}`,
		async () => {
			return await adminApiService.getSearchAnalytics(days, domain);
		},
	);

	return {
		searchAnalytics: data,
		isLoading,
		error: error?.message || null,
		refresh: mutate,
	};
};

export const useReferrerStats = (days = 30, domain?: string) => {
	const { data, error, isLoading, mutate } = useSWR(
		`referrer-stats-${days}-${domain || "all"}`,
		async () => {
			return await adminApiService.getReferrerAnalytics(days, domain);
		},
	);

	return {
		referrerStats: data,
		isLoading,
		error: error?.message || null,
		refresh: mutate,
	};
};

// Domain Management Hooks
export const useAdminDomains = () => {
	const [isCreating, setIsCreating] = useState(false);
	const [isUpdating, setIsUpdating] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const {
		data: domains,
		error,
		isLoading,
		mutate,
	} = useSWR<Domain[]>("admin-domains", () => adminApiService.getDomains(), {
		revalidateOnFocus: false,
		dedupingInterval: 30000, // Cache for 30 seconds
	});

	const createDomain = async (domainData: CreateDomainRequest) => {
		setIsCreating(true);
		try {
			const newDomain = await adminApiService.createDomain(domainData);

			// Optimistically update the cache
			if (domains) {
				mutate([newDomain, ...domains], false);
			}

			// Revalidate to ensure consistency
			mutate();

			return newDomain;
		} catch (error) {
			console.error("Failed to create domain:", error);
			throw error;
		} finally {
			setIsCreating(false);
		}
	};

	const updateDomain = async (id: number, domainData: UpdateDomainRequest) => {
		setIsUpdating(true);
		try {
			const updatedDomain = await adminApiService.updateDomain(id, domainData);

			// Optimistically update the cache
			if (domains) {
				const updatedDomains = domains.map((domain) =>
					domain.id === id ? updatedDomain : domain,
				);
				mutate(updatedDomains, false);
			}

			// Revalidate to ensure consistency
			mutate();

			return updatedDomain;
		} catch (error) {
			console.error("Failed to update domain:", error);
			throw error;
		} finally {
			setIsUpdating(false);
		}
	};

	const deleteDomain = async (id: number) => {
		setIsDeleting(true);
		try {
			await adminApiService.deleteDomain(id);

			// Optimistically update the cache
			if (domains) {
				const filteredDomains = domains.filter((domain) => domain.id !== id);
				mutate(filteredDomains, false);
			}

			// Revalidate to ensure consistency
			mutate();
		} catch (error) {
			console.error("Failed to delete domain:", error);
			throw error;
		} finally {
			setIsDeleting(false);
		}
	};

	return {
		domains: domains || [],
		isLoading,
		isCreating,
		isUpdating,
		isDeleting,
		error: error?.message || null,
		createDomain,
		updateDomain,
		deleteDomain,
		refresh: mutate,
	};
};

export const useAdminDomain = (id: number) => {
	const {
		data: domain,
		error,
		isLoading,
		mutate,
	} = useSWR<Domain>(
		id ? `admin-domain-${id}` : null,
		() => adminApiService.getDomain(id),
		{
			revalidateOnFocus: false,
			dedupingInterval: 60000,
		},
	);

	return {
		domain,
		isLoading,
		error: error?.message || null,
		refresh: mutate,
	};
};
