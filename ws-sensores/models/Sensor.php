<?php

namespace app\models;

use yii\db\ActiveRecord;

/**
 * This is the model class for table "sensors".
 *
 * @property int $id
 * @property int $tenant_id
 * @property string $external_id
 * @property string|null $name
 * @property string|null $type
 * @property string|null $unit
 */
class Sensor extends ActiveRecord
{
    public static function tableName()
    {
        return 'sensors';
    }

    public function rules()
    {
        return [
            [['tenant_id', 'external_id'], 'required'],
            [['tenant_id'], 'integer'],
            [['external_id', 'name'], 'string', 'max' => 255],
            [['type'], 'string', 'max' => 100],
            [['unit'], 'string', 'max' => 20],
            [['tenant_id'], 'exist', 'skipOnError' => true, 'targetClass' => Tenant::class, 'targetAttribute' => ['tenant_id' => 'id']],
        ];
    }

    public function attributeLabels()
    {
        return [
            'id' => 'ID',
            'tenant_id' => 'Tenant ID',
            'external_id' => 'External ID',
            'name' => 'Name',
            'type' => 'Type',
            'unit' => 'Unit',
        ];
    }

    public function getTenant()
    {
        return $this->hasOne(Tenant::class, ['id' => 'tenant_id']);
    }
}
