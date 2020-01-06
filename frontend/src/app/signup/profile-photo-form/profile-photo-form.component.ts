import { Component, Input, Output } from '@angular/core'

import { SignupService } from '../../service/signup.service'
import { FormGroup, FormControl, Validators } from '@angular/forms'
import { EventEmitter } from 'events'

@Component({
	selector: 'profile-photo-form',
	templateUrl: './profile-photo-form.component.html',
	styleUrls: ['./profile-photo-form.component.css']
})
export class ProfilePhotoFormComponent {

	constructor(private signupService: SignupService) { }

	uploadedFiles: Array<File>

	fileType: Array<String> = ['image/jpeg', 'image/jpg', 'image/png']

	uploadFileText: String = 'Upload Profile Pic'

	fileUploadColor: String = "accent"

	defaultImgSrc: string = 'https://i.stack.imgur.com/X9JD4.png?s=136&g=1'

	@Input() id : string

	profilePhotoForm = new FormGroup({
		profileImage: new FormControl('',[Validators.required])
	})

	get profileImage() { return this.profilePhotoForm.get('profileImage') }

	fileChange(element) {
		let filetype = element.target.files[0].type
		if (this.fileType.indexOf(filetype) >= 0) {
			var reader = new FileReader();

			reader.onload = (event: any) => {
				this.defaultImgSrc = event.target.result;
			}

			reader.readAsDataURL(element.target.files[0]);

			this.uploadedFiles = element.target.files
			this.uploadFileText = "File Uploaded"
			this.fileUploadColor = "primary"
		}
		else {
			this.uploadFileText = "Invalid File"
			this.fileUploadColor = "warn"
		}

	}

	uploadFile() {
		document.getElementById('upload').click()
	}

	saveProfilePhoto(){
		let formData = new FormData()
		if(this.uploadedFiles !== undefined){
			for(var i=0;i< this.uploadedFiles.length; i++){
				formData.append("profileImage",this.uploadedFiles[i],this.uploadedFiles[i].name)
			}
			formData.append('userId', this.id)
			this.signupService.saveProfilePhoto(formData)
				.subscribe((res)=>{
					console.log(res.json())
				})
		}
	}
}
