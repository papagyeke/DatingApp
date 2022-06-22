import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of, pipe } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Member } from '../_models/member';
import { PaginatedResult } from '../_models/pagination';
import { User } from '../_models/user';
import { UserParams } from '../_models/userParams';
import { AccountService } from './account.service';

const httpOptions = {//not used anymore
  headers: new HttpHeaders({
    Authorization: 'Bearer ' + JSON.parse(localStorage.getItem('user'))?.token
  })
}

@Injectable({
  providedIn: 'root'
})
export class MembersService {
  baseUrl = environment.apiUrl;
  members: Member[] = [];
  user: User;
  UserParams: UserParams;
  memberCache = new Map(); //a dictionary-like bject to store keys for caching

  constructor(private http: HttpClient, private accountService:AccountService) { 
    this.accountService.currentUser$.pipe(take(1)).subscribe(user => {
      this.user = user;
      this.UserParams = new UserParams(user);
    })
  }

  getUserParams(){
    return this.UserParams;
  }

  setUserParams(params:UserParams){
    this.UserParams = params;
  }

  resetUserParams(){
    this.UserParams = new UserParams(this.user);
    return this.UserParams;
  }

  getMembers(userParams: UserParams) {

    var response = this.memberCache.get(Object.values(userParams).join('-'));
    if(response){
      return of(response);
    }

    let params = this.getPaginationHeaders(userParams.pageNumber,userParams.pageSize);
    //add additional options to the filter object
    params = params.append('minAge',userParams.minAge.toString());
    params = params.append('maxAge',userParams.maxAge.toString());
    params = params.append('gender',userParams.gender);
    params = params.append('orderBy',userParams.orderBy);


    //if(this.members.length>0) return of(this.members);
    return this.getPaginatedResult<Member[]>(this.baseUrl,params)
      .pipe(map(response=>{
        this.memberCache.set(Object.values(userParams).join('-'), response);//if result from API is equal to cache object the return cache
        return response;
      }))
  }


  

  getMember(username: string) {
    const member =[...this.memberCache.values()]
      .reduce((arr,elem)=> arr.concat(elem.result),[])
      .find((member:Member)=>member.username === username); //adds the separately cached values into one array with no repeats
    if(member){
      return of(member);
    }
    return this.http.get<Member>(this.baseUrl + 'users/' + username);
  }

  updateMember(member: Member) {
    return this.http.put(this.baseUrl + 'users', member).pipe(
      map(() => {
        const index = this.members.indexOf(member);
        this.members[index] = member;
      })
    )
  }

  setMainPhoto(photoId: number) {
    return this.http.put(this.baseUrl + 'users/set-main-photo/' + photoId, {});
  }

  deletePhoto(photoId: number) {
    return this.http.delete(this.baseUrl + 'users/delete-photo/' + photoId)
  }

  //helper functions
  private getPaginatedResult<T>(url,params) {
    const paginatedResult: PaginatedResult<T> = new PaginatedResult<T>();

    return this.http.get<T>(url + 'users', { observe: 'response', params }).pipe(
      map(response => {
        paginatedResult.result = response.body;
        if (response.headers.get('Pagination') !== null) {
          paginatedResult.pagination = JSON.parse(response.headers.get('Pagination'));
        }
        return paginatedResult;
      })
    );
  }

  //method to pull in pagination options
  private getPaginationHeaders(pageNumber: number, pageSize: number) {
    let params = new HttpParams();

    params = params.append('pageNumber', pageNumber.toString());
    params = params.append('pageSize', pageSize.toString());
    return params
  }
}
