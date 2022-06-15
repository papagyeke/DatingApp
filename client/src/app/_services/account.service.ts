import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import {map} from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { User } from '../_models/user';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  baseUrl = environment.apiUrl;    //service are singleton (lasts as long as application)
  private currentUserSource = new ReplaySubject<User>(1) //buffer for user object
  currentUser$ = this.currentUserSource.asObservable();

  constructor(private http: HttpClient) { }

  login(model:any){
    return this.http.post(this.baseUrl + 'account/login', model).pipe(
      map((response:User)=>{
        const user = response;
        if(user){
          this.setCurrentUser(user);
        }
      })
    )
  }

  register(model:any){
    return this.http.post(this.baseUrl + 'account/register',model).pipe(
      map((user:User) =>{
        if(user){
          this.setCurrentUser(user);
        }
      })
    )
  }

  setCurrentUser(user: User){
    localStorage.setItem('user',JSON.stringify(user));//populate the user inside localstorage in the browser
    this.currentUserSource.next(user);
  }

  logout(){
    localStorage.removeItem('user');
    this.currentUserSource.next(null);
  }
}
