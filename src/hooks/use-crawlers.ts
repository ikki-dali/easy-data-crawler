import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Crawler } from '@/types/crawler';

interface CrawlerFilters {
  platform?: string;
  status?: string;
  search?: string;
}

async function fetchCrawlers(filters: CrawlerFilters): Promise<Crawler[]> {
  const params = new URLSearchParams();
  if (filters.platform) params.set('platform', filters.platform);
  if (filters.status) params.set('status', filters.status);
  if (filters.search) params.set('search', filters.search);

  const response = await fetch(`/api/crawlers?${params}`);
  if (!response.ok) {
    throw new Error('クローラーの取得に失敗しました');
  }
  return response.json();
}

export function useCrawlers(filters: CrawlerFilters = {}) {
  return useQuery({
    queryKey: ['crawlers', filters],
    queryFn: () => fetchCrawlers(filters),
  });
}

async function deleteCrawler(id: string): Promise<void> {
  const response = await fetch(`/api/crawlers/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('クローラーの削除に失敗しました');
  }
}

export function useDeleteCrawler() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCrawler,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crawlers'] });
    },
  });
}

async function duplicateCrawler(id: string): Promise<Crawler> {
  const response = await fetch(`/api/crawlers/${id}/duplicate`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('クローラーの複製に失敗しました');
  }
  return response.json();
}

export function useDuplicateCrawler() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: duplicateCrawler,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crawlers'] });
    },
  });
}

