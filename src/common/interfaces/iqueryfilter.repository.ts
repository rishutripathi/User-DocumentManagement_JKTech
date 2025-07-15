export interface IQueryFilter<T> {
  offset?: number;
  limit?: number;
  order?: Array<[string, 'ASC' | 'DESC']> | { field: string; direction: 'ASC' | 'DESC' };
  [key: string]: any;
}
