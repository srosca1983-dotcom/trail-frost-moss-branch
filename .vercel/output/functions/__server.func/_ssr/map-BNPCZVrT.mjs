//#region node_modules/.nitro/vite/services/ssr/assets/map-BNPCZVrT.js
function str(v) {
	if (v === null || v === void 0) return null;
	const s = String(v);
	return s.length ? s : null;
}
function bool(v) {
	return v === true || v === "t" || v === "true" || v === 1 || v === "1";
}
function mapCrew(r) {
	return {
		id: String(r.id),
		fullName: String(r.full_name),
		firstName: str(r.first_name),
		lastName: str(r.last_name),
		middleName: str(r.middle_name),
		ssLast4: str(r.ss_last4),
		dob: str(r.dob),
		sex: str(r.sex),
		placeOfBirth: str(r.place_of_birth),
		citizenship: str(r.citizenship),
		race: str(r.race),
		hairColor: str(r.hair_color),
		eyeColor: str(r.eye_color),
		height: str(r.height),
		weight: str(r.weight),
		addressLine: str(r.address_line),
		city: str(r.city),
		state: str(r.state),
		zip: str(r.zip),
		homePhone: str(r.home_phone),
		cellPhone: str(r.cell_phone),
		email: str(r.email),
		nearestAirport: str(r.nearest_airport),
		airportCode: str(r.airport_code),
		maritimeCollege: str(r.maritime_college),
		yearGraduated: str(r.year_graduated),
		combatVeteran: bool(r.combat_veteran),
		maritalStatus: str(r.marital_status),
		mmcNumber: str(r.mmc_number),
		mmcPlaceOfIssue: str(r.mmc_place_of_issue),
		mmcExpiration: str(r.mmc_expiration),
		passportNumber: str(r.passport_number),
		passportExpiration: str(r.passport_expiration),
		status: str(r.status) ?? "past",
		lastPosition: str(r.last_position),
		lastVessel: str(r.last_vessel),
		glasses: bool(r.glasses),
		spareGlasses: bool(r.spare_glasses),
		allergies: str(r.allergies),
		medications: str(r.medications),
		medicalRemarks: str(r.medical_remarks),
		notes: str(r.notes),
		unionHall: str(r.union_hall),
		assignmentType: str(r.assignment_type),
		seniorityClass: str(r.seniority_class),
		watch: str(r.watch),
		billetCode: str(r.billet_code),
		permanentRating: str(r.permanent_rating),
		createdAt: String(r.created_at ?? ""),
		updatedAt: String(r.updated_at ?? "")
	};
}
function mapNok(r) {
	return {
		id: String(r.id),
		crewId: String(r.crew_id),
		fullName: String(r.full_name),
		relationship: str(r.relationship),
		addressLine: str(r.address_line),
		city: str(r.city),
		state: str(r.state),
		zip: str(r.zip),
		phone: str(r.phone),
		cellPhone: str(r.cell_phone)
	};
}
function mapDoc(r) {
	return {
		id: String(r.id),
		crewId: String(r.crew_id),
		docType: String(r.doc_type),
		label: String(r.label),
		docNumber: str(r.doc_number),
		issuedOn: str(r.issued_on),
		expiresOn: str(r.expires_on),
		notes: str(r.notes),
		sourcePacket: str(r.source_packet)
	};
}
function mapTour(r) {
	return {
		id: String(r.id),
		crewId: String(r.crew_id),
		vessel: String(r.vessel ?? "M/V GEORGE II"),
		position: str(r.position),
		signOn: str(r.sign_on),
		signOff: str(r.sign_off),
		port: str(r.port),
		relieving: str(r.relieving),
		assignmentType: str(r.assignment_type),
		lengthDays: r.length_days === null || r.length_days === void 0 ? null : Number(r.length_days),
		dispatchRef: str(r.dispatch_ref),
		unionHall: str(r.union_hall),
		notes: str(r.notes),
		watch: str(r.watch),
		dueOff: str(r.due_off),
		dueOffRule: str(r.due_off_rule),
		billetCode: str(r.billet_code),
		seniorityClass: str(r.seniority_class),
		extraDays: r.extra_days === null || r.extra_days === void 0 ? 0 : Number(r.extra_days),
		leaveDays: r.leave_days === null || r.leave_days === void 0 ? 0 : Number(r.leave_days),
		leaveCount: r.leave_count === null || r.leave_count === void 0 ? 0 : Number(r.leave_count),
		leaveStartedOn: str(r.leave_started_on)
	};
}
function mapForm(r) {
	return {
		id: String(r.id),
		crewId: String(r.crew_id),
		tourId: str(r.tour_id),
		formCode: String(r.form_code),
		formLabel: String(r.form_label),
		completedOn: str(r.completed_on),
		present: bool(r.present)
	};
}
function mapReq(r) {
	return {
		id: String(r.id),
		code: String(r.code),
		label: String(r.label),
		kind: r.kind === "certificate" ? "certificate" : "form",
		appliesTo: String(r.applies_to ?? "all"),
		required: bool(r.required),
		source: String(r.source ?? "sro"),
		sortOrder: Number(r.sort_order ?? 0),
		notes: str(r.notes)
	};
}
function detailToParsed(c) {
	const nok = c.nok[0];
	const lastTour = c.tours[0];
	return {
		fullName: c.fullName,
		firstName: c.firstName,
		lastName: c.lastName,
		middleName: c.middleName,
		ssLast4: c.ssLast4,
		dob: c.dob,
		sex: c.sex,
		placeOfBirth: c.placeOfBirth,
		citizenship: c.citizenship,
		race: c.race,
		hairColor: c.hairColor,
		eyeColor: c.eyeColor,
		height: c.height,
		weight: c.weight,
		addressLine: c.addressLine,
		city: c.city,
		state: c.state,
		zip: c.zip,
		homePhone: c.homePhone,
		cellPhone: c.cellPhone,
		email: c.email,
		nearestAirport: c.nearestAirport,
		airportCode: c.airportCode,
		maritimeCollege: c.maritimeCollege,
		yearGraduated: c.yearGraduated,
		combatVeteran: c.combatVeteran,
		maritalStatus: c.maritalStatus,
		mmcNumber: c.mmcNumber,
		mmcPlaceOfIssue: c.mmcPlaceOfIssue,
		mmcExpiration: c.mmcExpiration,
		passportNumber: c.passportNumber,
		passportExpiration: c.passportExpiration,
		lastPosition: c.lastPosition,
		glasses: c.glasses,
		spareGlasses: c.spareGlasses,
		allergies: c.allergies,
		medications: c.medications,
		medicalRemarks: c.medicalRemarks,
		notes: c.notes,
		signOnRequired: true,
		nextOfKin: nok ? {
			fullName: nok.fullName,
			relationship: nok.relationship,
			addressLine: nok.addressLine,
			city: nok.city,
			state: nok.state,
			zip: nok.zip,
			phone: nok.phone,
			cellPhone: nok.cellPhone
		} : null,
		previousEmployers: [],
		documents: c.documents.map((d) => ({
			docType: d.docType,
			label: d.label,
			docNumber: d.docNumber,
			issuedOn: d.issuedOn,
			expiresOn: d.expiresOn,
			notes: d.notes
		})),
		tour: lastTour ? {
			vessel: lastTour.vessel,
			position: lastTour.position,
			signOn: lastTour.signOn,
			signOff: lastTour.signOff,
			port: lastTour.port,
			relieving: lastTour.relieving,
			assignmentType: lastTour.assignmentType,
			lengthDays: lastTour.lengthDays,
			dispatchRef: lastTour.dispatchRef,
			unionHall: lastTour.unionHall,
			watch: lastTour.watch,
			billetCode: lastTour.billetCode,
			seniorityClass: lastTour.seniorityClass,
			dueOff: lastTour.dueOff
		} : null,
		formsFound: c.forms.map((f) => ({
			code: f.formCode,
			label: f.formLabel,
			completedOn: f.completedOn
		}))
	};
}
//#endregion
export { mapNok as a, mapForm as i, mapCrew as n, mapReq as o, mapDoc as r, mapTour as s, detailToParsed as t };
