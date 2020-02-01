export type UpgradeType = 'range'|'damage'|'attackSpeed'|'maxHP'|'movementSpeed';

export interface UpgradeObject {
	'range': number;
	'damage': number;
	'attackSpeed': number;
	'maxHP': number;
	'movementSpeed': number;
}
