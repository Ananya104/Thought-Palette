import { Injectable, Output, EventEmitter } from '@angular/core'
import { Http } from '@angular/http'
import { Router } from '@angular/router';

import { AuthGuardService } from './auth-guard.service'
import { UserService } from './user.service'


@Injectable({
	providedIn: 'root'
})
export class ProfileService {

	@Output() fire: EventEmitter<any> = new EventEmitter()

	defaultProfileImage: string = 'https://pngimage.net/wp-content/uploads/2018/05/default-user-image-png-7.png'

	constructor(
		private http: Http,
		private authGuardService: AuthGuardService,
		private userService: UserService,
		private router: Router
	) { }

	getProfile() {
		let headers = this.userService.appendHeaders()

		return this.http.get(`/api${this.router.url}`, {
			headers: headers
		})
	}

	updateProfile(object, updateStatus) {
		let headers = this.userService.appendHeaders()

		return this.http.patch(`/api/${this.authGuardService.currentUser}/${updateStatus}`, object, {
			headers: headers
		})
	}

	updatePassword(object) {
		let headers = this.userService.appendHeaders()

		return this.http.patch(`/api${this.router.url}/password`,object,{
			headers: headers
		})
	}

	changeEmailValue(data){
		this.fire.emit(data);
	}

	emailValue(){
		return this.fire
	}

	username(id){
		let headers = this.userService.appendHeaders()

		return this.http.get(`/api/profile/id/${id}`,{
			headers: headers
		})
	}

	getAllProfileName(){
		let headers = this.userService.appendHeaders()

		return this.http.get(`/api/profile/name`,{
			headers: headers
		})
	}
}
