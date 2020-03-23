import { Injectable, Output, EventEmitter } from '@angular/core'
import { Http } from '@angular/http'

import { environment } from '../../environments/environment'
import { UserService } from './user.service'

@Injectable({
	providedIn: 'root'
})
export class CommentService {

	private basicUrl : string = environment.basicUrl

	@Output() deleteCommentEvent: EventEmitter<any> = new EventEmitter()

	constructor(
		private http: Http,
		private userService: UserService
	) { }

	post(object, postId) {
		let commentObject = {
			postId: postId,
			text: object.comment,
			createdBy: null
		}
		let headers = this.userService.appendHeaders()

		return this.http.post(`${this.basicUrl}/api/comment`, commentObject, {
			headers: headers
		})
	}

	get(postId: string) {
		let headers = this.userService.appendHeaders()

		return this.http.get(`${this.basicUrl}/api/comment`, {
			headers: headers,
			params: { postId: postId }
		})
	}

	delete(id: string){
		let headers = this.userService.appendHeaders()

		return this.http.delete(`${this.basicUrl}/api/comment/${id}`,{
			headers: headers
		})
	}

	changeComment(data){
		this.deleteCommentEvent.emit(data)
	}

	getEmittedComment(){
		return this.deleteCommentEvent
	}
}

export interface Comment{
	_id: string
	postId: string
	text: string
	createdBy: string
	createdAt: Date
}