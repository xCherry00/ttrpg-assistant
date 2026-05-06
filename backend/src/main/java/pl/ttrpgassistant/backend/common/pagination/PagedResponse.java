package pl.ttrpgassistant.backend.common.pagination;

import java.util.List;

public record PagedResponse<T>(
        List<T> items,
        int page,
        int size,
        long totalItems,
        int totalPages,
        boolean hasNext,
        boolean hasPrevious
) {
    public static <T> PagedResponse<T> of(List<T> allItems, Integer pageInput, Integer sizeInput) {
        int page = Math.max(0, pageInput == null ? 0 : pageInput);
        int size = Math.max(1, Math.min(100, sizeInput == null ? 50 : sizeInput));
        int fromIndex = Math.min(page * size, allItems.size());
        int toIndex = Math.min(fromIndex + size, allItems.size());
        int totalPages = allItems.isEmpty() ? 0 : (int) Math.ceil((double) allItems.size() / size);

        return new PagedResponse<>(
                allItems.subList(fromIndex, toIndex),
                page,
                size,
                allItems.size(),
                totalPages,
                page + 1 < totalPages,
                page > 0
        );
    }
}
