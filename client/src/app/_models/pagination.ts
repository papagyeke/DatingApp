export interface Pagination{
    currentPage: number;
    itemsPerPage:number;
    totalItems: number;
    totalPages: number;
}

export class PaginatedResult<T> {
    result: T; //store list of members here
    pagination: Pagination;
}