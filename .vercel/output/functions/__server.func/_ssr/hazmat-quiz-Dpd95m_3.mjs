import { p as inferDepartment, y as positionLabel } from "./ratings-WR-IukGV.mjs";
import { s as needsSmsHazmat } from "./sms-training-gdj5DqvS.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/hazmat-quiz-Dpd95m_3.js
var HAZMAT_CFR = "49 CFR 172.700–704 · 49 CFR 176.13 · IMDG 1.3";
var HAZMAT_QUESTIONS = [
	{
		n: 1,
		element: "awareness",
		prompt: "49 CFR 172.704 requires hazmat training in which set of elements?",
		choices: [
			{
				key: "A",
				text: "Firefighting, first aid, and radar only"
			},
			{
				key: "B",
				text: "General awareness, function-specific, safety, and security awareness (in-depth security only if you have security-plan duties)"
			},
			{
				key: "C",
				text: "ISM familiarization and SASH only"
			},
			{
				key: "D",
				text: "A toolbox talk at the start of each voyage"
			}
		],
		answer: "B",
		why: "172.704(a) lists those elements. In-depth security is only for people with security-plan responsibilities."
	},
	{
		n: 2,
		element: "record",
		prompt: "How often must hazmat training be repeated under 49 CFR 172.704(c)(2)?",
		choices: [
			{
				key: "A",
				text: "Every calendar year"
			},
			{
				key: "B",
				text: "Every 5 years with STCW basic training"
			},
			{
				key: "C",
				text: "At least once every 3 years"
			},
			{
				key: "D",
				text: "Only when the SMS is revised"
			}
		],
		answer: "C",
		why: "Recurrent training is due at least once every three years."
	},
	{
		n: 3,
		element: "awareness",
		prompt: "On a U.S.-flag container vessel, who is a “hazmat employee” under 49 CFR 176.13 / 172.704?",
		choices: [
			{
				key: "A",
				text: "Only the Master"
			},
			{
				key: "B",
				text: "Anyone who loads, unloads, handles, stows, or supervises dangerous cargo, or who is responsible for its safety in transport"
			},
			{
				key: "C",
				text: "Only people with a tankerman endorsement"
			},
			{
				key: "D",
				text: "Steward department only, because of ship’s stores"
			}
		],
		answer: "B",
		why: "Part 176 points back to Subpart H of Part 172. Handling or supervising DG makes you a hazmat employee."
	},
	{
		n: 4,
		element: "record",
		prompt: "The HMR says a hazmat employee must be:",
		choices: [
			{
				key: "A",
				text: "Trained only — a sign-in sheet is enough"
			},
			{
				key: "B",
				text: "Trained and tested, and a record kept"
			},
			{
				key: "C",
				text: "Given a copy of the IMDG Code"
			},
			{
				key: "D",
				text: "Licensed by PHMSA as a shipper"
			}
		],
		answer: "B",
		why: "172.702/704: train AND test. 172.704(d) is the record."
	},
	{
		n: 5,
		element: "record",
		prompt: "A legal training record under 172.704(d) must include all of the following except:",
		choices: [
			{
				key: "A",
				text: "The employee’s name and the most recent training date"
			},
			{
				key: "B",
				text: "A description, copy, or location of the training materials"
			},
			{
				key: "C",
				text: "The employee’s home address and next of kin"
			},
			{
				key: "D",
				text: "Name and address of the trainer, and a certification that the person was trained and tested"
			}
		],
		answer: "C",
		why: "Home address and NOK are not 172.704(d) items."
	},
	{
		n: 6,
		element: "awareness",
		prompt: "IMDG Class 3 is:",
		choices: [
			{
				key: "A",
				text: "Explosives"
			},
			{
				key: "B",
				text: "Gases"
			},
			{
				key: "C",
				text: "Flammable liquids"
			},
			{
				key: "D",
				text: "Radioactive material"
			}
		],
		answer: "C",
		why: "Class 3 = flammable liquids (gasoline, paints, some alcohols)."
	},
	{
		n: 7,
		element: "awareness",
		prompt: "A red diamond with a flame, labeled 2.1, means:",
		choices: [
			{
				key: "A",
				text: "Flammable gas"
			},
			{
				key: "B",
				text: "Non-flammable, non-toxic gas"
			},
			{
				key: "C",
				text: "Toxic gas"
			},
			{
				key: "D",
				text: "Organic peroxide"
			}
		],
		answer: "A",
		why: "2.1 flammable gas; 2.2 non-flammable; 2.3 toxic gas."
	},
	{
		n: 8,
		element: "function",
		prompt: "On a container, a 250 mm placard is used for the box. Labels (100 mm) are used for:",
		choices: [
			{
				key: "A",
				text: "The ship’s funnel"
			},
			{
				key: "B",
				text: "Inner packages / drums inside the container, and some packages that move as packages"
			},
			{
				key: "C",
				text: "The Master’s office door"
			},
			{
				key: "D",
				text: "Only empty tanks"
			}
		],
		answer: "B",
		why: "Placards mark the CTU. Labels mark packages."
	},
	{
		n: 9,
		element: "awareness",
		prompt: "A UN number (for example UN 1203) identifies:",
		choices: [
			{
				key: "A",
				text: "The ship’s IMO number"
			},
			{
				key: "B",
				text: "The specific dangerous good, so you can look up stowage, segregation, and emergency schedules"
			},
			{
				key: "C",
				text: "The container’s CSC approval"
			},
			{
				key: "D",
				text: "The voyage number"
			}
		],
		answer: "B",
		why: "UN numbers are the key into IMDG / ERG / EmS."
	},
	{
		n: 10,
		element: "awareness",
		prompt: "Packing group I, II, and III describe:",
		choices: [
			{
				key: "A",
				text: "Which union hall the mariner came from"
			},
			{
				key: "B",
				text: "Great danger, medium danger, and minor danger of the substance"
			},
			{
				key: "C",
				text: "On-deck, under-deck, and magazine stowage"
			},
			{
				key: "D",
				text: "The three watches"
			}
		],
		answer: "B",
		why: "PG I = great danger, II = medium, III = minor."
	},
	{
		n: 11,
		element: "function",
		prompt: "A dead-fish / dead-tree marine pollutant mark on a container means:",
		choices: [
			{
				key: "A",
				text: "Ship’s stores only — ignore it at sea"
			},
			{
				key: "B",
				text: "The cargo is a marine pollutant; treat spills as a threat to the sea and follow the DG papers / MARPOL"
			},
			{
				key: "C",
				text: "The box is empty and gas-free"
			},
			{
				key: "D",
				text: "The cargo is food-grade"
			}
		],
		answer: "B",
		why: "Marine pollutant mark = IMDG / MARPOL Annex III cargo. Report and contain."
	},
	{
		n: 12,
		element: "function",
		prompt: "Segregation on a container vessel is based on IMDG segregation tables. You must not stow:",
		choices: [
			{
				key: "A",
				text: "Class 8 acids next to Class 5.1 oxidizers or Class 4.3 water-reactives without checking the table"
			},
			{
				key: "B",
				text: "Any two containers on the same bay"
			},
			{
				key: "C",
				text: "Reefer boxes on deck"
			},
			{
				key: "D",
				text: "Empty containers forward of the house"
			}
		],
		answer: "A",
		why: "Incompatible classes (acids / oxidizers / water-reactives) are the classic segregation failures."
	},
	{
		n: 13,
		element: "function",
		prompt: "Class 1 explosives on a container ship are normally:",
		choices: [
			{
				key: "A",
				text: "Stowed under deck in the engine room"
			},
			{
				key: "B",
				text: "Stowed as the IMDG / cargo plan requires — often on deck, clear of accommodation, with the permitted quantities"
			},
			{
				key: "C",
				text: "Kept in the paint locker"
			},
			{
				key: "D",
				text: "Carried only if the bosun agrees"
			}
		],
		answer: "B",
		why: "Explosives have tight stowage and quantity rules. Follow the plan, not habit."
	},
	{
		n: 14,
		element: "function",
		prompt: "The dangerous goods manifest (or special list) required by 49 CFR 176.30 / SOLAS VII:",
		choices: [
			{
				key: "A",
				text: "May be discarded after sailing"
			},
			{
				key: "B",
				text: "Must be kept on board, readily available, and list UN number, class, stowage location, and quantity"
			},
			{
				key: "C",
				text: "Is only for the agent ashore"
			},
			{
				key: "D",
				text: "Is the same document as the CSC plate"
			}
		],
		answer: "B",
		why: "The DG manifest is the shipboard list of what is where. Keep it current and findable."
	},
	{
		n: 15,
		element: "safety",
		prompt: "A DG container is on fire. After raising the alarm and protecting life, your first written references for that UN number are:",
		choices: [
			{
				key: "A",
				text: "The union contract"
			},
			{
				key: "B",
				text: "The IMDG EmS fire/spill schedules and the Emergency Response Guidebook (or equivalent shipboard ERG)"
			},
			{
				key: "C",
				text: "The cyber incident plan"
			},
			{
				key: "D",
				text: "The crew list"
			}
		],
		answer: "B",
		why: "EmS (fire / spillage) and ERG tell you water vs foam vs isolate, and whether to fight or let burn."
	},
	{
		n: 16,
		element: "safety",
		prompt: "Water is the WRONG extinguishing agent for which class?",
		choices: [
			{
				key: "A",
				text: "Class 3 flammable liquids in all cases"
			},
			{
				key: "B",
				text: "Class 4.3 dangerous when wet — water-reactive substances"
			},
			{
				key: "C",
				text: "Class 9 miscellaneous"
			},
			{
				key: "D",
				text: "Marine pollutants"
			}
		],
		answer: "B",
		why: "4.3 + water can make flammable gas. EmS will say isolate / dry agent."
	},
	{
		n: 17,
		element: "function",
		prompt: "“Limited quantity” (LQ) dangerous goods:",
		choices: [
			{
				key: "A",
				text: "Are not dangerous and may be stowed anywhere"
			},
			{
				key: "B",
				text: "Are still dangerous goods, but packed in small inner packagings with reduced marks — still follow the cargo papers"
			},
			{
				key: "C",
				text: "May only be carried by aircraft"
			},
			{
				key: "D",
				text: "Do not need a UN number in the papers"
			}
		],
		answer: "B",
		why: "LQ is a packing exception, not a free pass. The papers still govern."
	},
	{
		n: 18,
		element: "function",
		prompt: "49 CFR Part 176 is the HMR subchapter that covers:",
		choices: [
			{
				key: "A",
				text: "Carriage by aircraft"
			},
			{
				key: "B",
				text: "Carriage by rail"
			},
			{
				key: "C",
				text: "Carriage by vessel"
			},
			{
				key: "D",
				text: "Highway only"
			}
		],
		answer: "C",
		why: "176 = vessel. 172 = general/shipper. 173 = packagings. 175 = air. 177 = highway."
	},
	{
		n: 19,
		element: "safety",
		prompt: "If a DG container leaks on deck, you should first:",
		choices: [
			{
				key: "A",
				text: "Open the doors to ventilate without checking the class"
			},
			{
				key: "B",
				text: "Keep people upwind/uphill, raise the alarm, identify the UN number from the placard/papers, then follow EmS / the Master’s orders"
			},
			{
				key: "C",
				text: "Wash it straight overboard in every case"
			},
			{
				key: "D",
				text: "Ignore it until the next port"
			}
		],
		answer: "B",
		why: "Identify first. Some leaks you isolate; some you can dilute; some you must not wash overboard."
	},
	{
		n: 20,
		element: "security",
		prompt: "Security awareness for dangerous goods on this vessel means:",
		choices: [
			{
				key: "A",
				text: "Leave the DG manifest on the gangway so the agent can grab it"
			},
			{
				key: "B",
				text: "Control access to DG papers and cargo spaces, report unexplained interest in the boxes, and follow the vessel security plan — do not peel placards"
			},
			{
				key: "C",
				text: "Only the bosun needs to know what is on board"
			},
			{
				key: "D",
				text: "Hide class 1 boxes by covering the marks"
			}
		],
		answer: "B",
		why: "172.704(a)(4) security awareness: recognize risks, keep papers and access under control, report odd interest. Placards are required marks."
	}
];
var HAZMAT_STUDY = [
	{
		heading: "Why you are sitting this",
		lines: [
			"George II carries containerized dangerous goods. 49 CFR 172.704 and 176.13 say every hazmat employee must be trained AND tested. A sign-in sheet is not a test.",
			"SMM-PER-06 Table 4.5 marks HAZMAT “H” on Master, Chief Mate, Second Mate, and Third Mate (1 per vessel if carrying HAZMAT). That is the company minimum. Bosun and ABs are not on that mark unless they are actually handling DG — then the federal rule still applies to them.",
			"This course is written for an unlimited container vessel: IMDG classes, placards, segregation, the DG manifest, and fire/spill on a box."
		]
	},
	{
		heading: "The five 172.704 elements",
		lines: [
			"1. General awareness — recognize DG, UN numbers, classes, placards, labels, marine-pollutant mark.",
			"2. Function-specific — what YOUR job does: cargo plan, stowage, segregation, papers, on-deck vs under-deck.",
			"3. Safety — emergency response, EmS / ERG, PPE, what not to put water on (Class 4.3).",
			"4. Security awareness — keep DG papers and access under control; report odd interest in the cargo.",
			"5. In-depth security — only if you are named in the vessel security plan for DG. Most mates complete 1–4.",
			"Repeat at least every 3 years. New hire: trained before performing the function, or within 90 days with supervision."
		]
	},
	{
		heading: "Classes you will see on this ship",
		lines: [
			"1 Explosives · 2.1 flammable gas · 2.2 non-flammable gas · 2.3 toxic gas · 3 flammable liquid · 4.1 flammable solid · 4.2 spontaneous · 4.3 dangerous when wet · 5.1 oxidizer · 5.2 organic peroxide · 6.1 toxic · 6.2 infectious · 7 radioactive · 8 corrosive · 9 miscellaneous (includes many lithium batteries and marine pollutants).",
			"Packing group I = great danger, II = medium, III = minor.",
			"UN number (UN 1203 = gasoline) is how you look up stowage, segregation, and EmS."
		]
	},
	{
		heading: "Boxes, papers, and the deck",
		lines: [
			"Placards (250 mm) go on the container. Labels (100 mm) go on packages. CSC plate = the box is structurally approved — it is NOT the DG document.",
			"DG manifest / special list (176.30 / SOLAS VII): UN number, class, stowage location, quantity. Keep it on board and findable.",
			"Segregation: never park Class 8 acids against 5.1 oxidizers or 4.3 water-reactives without the IMDG table. Class 1 follows the cargo plan — often on deck, clear of the house.",
			"Limited quantity is still DG. Follow the papers."
		]
	},
	{
		heading: "If it leaks or burns",
		lines: [
			"Raise the alarm. Keep people upwind. Read the UN number off the placard or the DG manifest. Open EmS (fire / spillage) and the ERG. Then take the Master’s / Chief Mate’s orders.",
			"Do not open doors “to see” on a toxic or unknown leak. Do not put water on Class 4.3. Do not wash every spill overboard — marine pollutants and some toxics are a MARPOL incident.",
			"Report the incident up the chain (Master) so it can go to the company and, when required, the Coast Guard."
		]
	},
	{
		heading: "How to take the quiz",
		lines: ["Study this sheet. Put it away. Circle one letter on the quiz. 20 questions. 16 correct (80%) to pass. Return the quiz to the Chief Mate. Do not copy the answer key."]
	}
];
function parseHazmatScore(text) {
	if (!text) return null;
	const m = String(text).match(/\b(\d{1,2})\s*\/\s*20\b/);
	if (!m) return null;
	const n = Number(m[1]);
	if (!Number.isFinite(n) || n < 0 || n > HAZMAT_QUESTIONS.length) return null;
	return n;
}
function passedHazmat(score) {
	return Number.isFinite(score) && score >= 16 && score <= HAZMAT_QUESTIONS.length;
}
function classifyHazmatSeat(p) {
	const parts = p.fullName.trim().split(/\s+/);
	return {
		crewId: p.id,
		fullName: p.fullName,
		lastName: p.lastName || parts.at(-1) || p.fullName,
		firstName: p.firstName || parts[0] || "",
		position: p.lastPosition,
		positionLabel: positionLabel(p.lastPosition),
		department: inferDepartment(p.lastPosition),
		mmcNumber: p.mmcNumber ?? null,
		required: needsSmsHazmat(p.lastPosition),
		lastScore: p.hazmatScore ?? null,
		lastIssued: p.hazmatIssued ?? null
	};
}
function classifyHazmatCrew(list) {
	return list.filter((p) => p.status == null || p.status === "current").map(classifyHazmatSeat).sort((a, b) => Number(b.required) - Number(a.required) || a.lastName.localeCompare(b.lastName));
}
function requiredHazmatSeats(seats) {
	return seats.filter((s) => s.required);
}
//#endregion
export { parseHazmatScore as a, classifyHazmatCrew as i, HAZMAT_QUESTIONS as n, passedHazmat as o, HAZMAT_STUDY as r, requiredHazmatSeats as s, HAZMAT_CFR as t };
